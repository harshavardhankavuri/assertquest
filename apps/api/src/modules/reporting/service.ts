import { prisma } from "../../core/db.js";
import { ApiError } from "../../core/errors.js";
import { enqueue } from "../../core/queue.js";
import { buildBuckets } from "./bucketing.js";
import type { ReportQueryInput } from "./schema.js";
import type { ReportSummary, ReportJob as PublicReportJob } from "@assertquest/shared";
import type { ReportJob as PrismaReportJob } from "@prisma/client";

// Date range semantics (FR-1302): `from` is inclusive, `to` is exclusive — a
// shipment created exactly at `to` is NOT included, the same convention as most
// half-open range queries. Documented in docs/api/reporting.md.
export async function getSummary(query: ReportQueryInput): Promise<ReportSummary> {
  const rows = await prisma.shipment.findMany({
    where: { createdAt: { gte: new Date(query.from), lt: new Date(query.to) } },
    select: { createdAt: true, priceCents: true },
  });

  const buckets = buildBuckets(rows, query.groupBy, query.timeZone);
  const totalShipments = rows.length;
  const totalRevenueCents = rows.reduce((sum, r) => sum + r.priceCents, 0);

  return { buckets, totalShipments, totalRevenueCents };
}

function toPublicJob(j: PrismaReportJob): PublicReportJob {
  return {
    id: j.id,
    requestedById: j.requestedById,
    fromDate: j.fromDate.toISOString(),
    toDate: j.toDate.toISOString(),
    groupBy: j.groupBy as PublicReportJob["groupBy"],
    timeZone: j.timeZone,
    status: j.status,
    failureReason: j.failureReason,
    createdAt: j.createdAt.toISOString(),
    readyAt: j.readyAt ? j.readyAt.toISOString() : null,
  };
}

function toCsv(summary: ReportSummary): string {
  const header = "period,shipmentCount,revenueCents";
  const rows = summary.buckets.map((b) => `${b.period},${b.shipmentCount},${b.revenueCents}`);
  return [header, ...rows].join("\n") + "\n";
}

// Scheduled report generation (FR-1303): the CSV is built asynchronously, on the
// same queue notifications use — the job is "pending" immediately after this
// returns and only becomes "ready" (or "failed") once the queued work runs.
export async function createReportJob(requestedById: string, query: ReportQueryInput): Promise<PublicReportJob> {
  const job = await prisma.reportJob.create({
    data: {
      requestedById,
      fromDate: new Date(query.from),
      toDate: new Date(query.to),
      groupBy: query.groupBy,
      timeZone: query.timeZone,
    },
  });

  enqueue(async () => {
    try {
      const summary = await getSummary(query);
      const csv = toCsv(summary);
      await prisma.reportJob.update({
        where: { id: job.id },
        data: { status: "ready", resultCsv: Buffer.from(csv, "utf-8"), readyAt: new Date() },
      });
    } catch (err) {
      await prisma.reportJob.update({
        where: { id: job.id },
        data: { status: "failed", failureReason: err instanceof Error ? err.message : "Unknown error" },
      });
    }
  });

  return toPublicJob(job);
}

async function findOwnedJob(id: string, requesterId: string, canSeeAll: boolean): Promise<PrismaReportJob> {
  const job = await prisma.reportJob.findUnique({ where: { id } });
  if (!job) throw ApiError.notFound("Report job not found");
  if (!canSeeAll && job.requestedById !== requesterId) {
    throw ApiError.forbidden("You do not have access to this report job");
  }
  return job;
}

export async function getReportJob(id: string, requesterId: string, canSeeAll: boolean): Promise<PublicReportJob> {
  const job = await findOwnedJob(id, requesterId, canSeeAll);
  return toPublicJob(job);
}

export async function downloadReportJob(id: string, requesterId: string, canSeeAll: boolean): Promise<Buffer> {
  const job = await findOwnedJob(id, requesterId, canSeeAll);
  if (job.status !== "ready" || !job.resultCsv) {
    throw ApiError.conflict(`Report job is "${job.status}", not ready for download yet`);
  }
  return Buffer.from(job.resultCsv);
}
