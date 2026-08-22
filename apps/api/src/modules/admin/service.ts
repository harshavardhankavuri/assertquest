import { prisma } from "../../core/db.js";
import { recordAudit } from "../../core/audit.js";
import { calculateQuote } from "../booking/pricing.js";
import { parseCsv, csvRowsToObjects } from "./csv.js";
import type { BulkActionInput } from "./schema.js";
import type {
  AuditLogEntry,
  BulkActionResponse,
  BulkActionItemResult,
  ImportReport,
  ImportRowResult,
  FeatureFlags,
} from "@assertquest/shared";
import { FEATURE_FLAG_KEYS } from "@assertquest/shared";

export async function listAuditLog(limit = 100): Promise<AuditLogEntry[]> {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: true },
  });
  return entries.map((e) => ({
    id: e.id,
    actorId: e.actorId,
    actorEmail: e.actor.email,
    action: e.action,
    targetType: e.targetType,
    targetId: e.targetId,
    metadata: e.metadata,
    createdAt: e.createdAt.toISOString(),
  }));
}

// Bulk approve/cancel (FR-1102). Each shipment id is processed independently — one
// failure (unknown id, or cancelling something already delivered) never blocks the
// others from succeeding. Always returns 200 with a per-item report rather than
// failing the whole request on a partial failure.
export async function bulkShipmentAction(actorId: string, input: BulkActionInput): Promise<BulkActionResponse> {
  const results: BulkActionItemResult[] = [];

  for (const shipmentId of input.shipmentIds) {
    const shipment = await prisma.shipment.findUnique({ where: { id: shipmentId } });
    if (!shipment) {
      results.push({ shipmentId, success: false, error: "Shipment not found" });
      continue;
    }

    if (input.action === "approve") {
      await prisma.shipment.update({ where: { id: shipmentId }, data: { approved: true } });
      results.push({ shipmentId, success: true });
      continue;
    }

    // action === "cancel"
    if (shipment.status === "delivered") {
      results.push({ shipmentId, success: false, error: "Cannot cancel a delivered shipment" });
      continue;
    }
    await prisma.shipment.update({ where: { id: shipmentId }, data: { status: "cancelled" } });
    results.push({ shipmentId, success: true });
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.length - succeeded;

  await recordAudit(actorId, `shipment.bulk_${input.action}`, {
    targetType: "shipment",
    metadata: { shipmentIds: input.shipmentIds, succeeded, failed },
  });

  return { action: input.action, results, succeeded, failed };
}

const REQUIRED_IMPORT_COLUMNS = [
  "customerEmail",
  "originLabel",
  "originLat",
  "originLng",
  "destinationLabel",
  "destinationLat",
  "destinationLng",
  "weightKg",
  "lengthCm",
  "widthCm",
  "heightCm",
] as const;

function parseRequiredNumber(value: string, field: string, errors: string[], min?: number, max?: number): number {
  const n = Number(value);
  if (value === "" || Number.isNaN(n)) {
    errors.push(`${field} must be a number`);
    return NaN;
  }
  if (min !== undefined && n < min) errors.push(`${field} must be >= ${min}`);
  if (max !== undefined && n > max) errors.push(`${field} must be <= ${max}`);
  return n;
}

// CSV bulk shipment import (FR-1103): every row is validated and reported on
// individually — malformed rows are rejected with reasons, valid rows are created,
// and nothing is rolled back because of a sibling row's failure.
export async function importShipmentsCsv(actorId: string, csvText: string): Promise<ImportReport> {
  const objects = csvRowsToObjects(parseCsv(csvText));
  const rows: ImportRowResult[] = [];

  for (let i = 0; i < objects.length; i++) {
    const rowNumber = i + 2; // +1 for header row, +1 for 1-indexing
    const obj = objects[i];
    const errors: string[] = [];

    for (const col of REQUIRED_IMPORT_COLUMNS) {
      if (!(col in obj) || obj[col] === "") errors.push(`Missing required column "${col}"`);
    }
    if (errors.length > 0) {
      rows.push({ row: rowNumber, status: "rejected", errors });
      continue;
    }

    const originLat = parseRequiredNumber(obj.originLat, "originLat", errors, -90, 90);
    const originLng = parseRequiredNumber(obj.originLng, "originLng", errors, -180, 180);
    const destinationLat = parseRequiredNumber(obj.destinationLat, "destinationLat", errors, -90, 90);
    const destinationLng = parseRequiredNumber(obj.destinationLng, "destinationLng", errors, -180, 180);
    const weightKg = parseRequiredNumber(obj.weightKg, "weightKg", errors, 0.001);
    const lengthCm = parseRequiredNumber(obj.lengthCm, "lengthCm", errors, 0.001);
    const widthCm = parseRequiredNumber(obj.widthCm, "widthCm", errors, 0.001);
    const heightCm = parseRequiredNumber(obj.heightCm, "heightCm", errors, 0.001);

    const customer = await prisma.user.findUnique({ where: { email: obj.customerEmail } });
    if (!customer || customer.role !== "customer") {
      errors.push(`Unknown customer email "${obj.customerEmail}"`);
    }

    if (errors.length > 0) {
      rows.push({ row: rowNumber, status: "rejected", errors });
      continue;
    }

    const origin = { label: obj.originLabel, lat: originLat, lng: originLng };
    const destination = { label: obj.destinationLabel, lat: destinationLat, lng: destinationLng };
    const pkg = { weightKg, lengthCm, widthCm, heightCm };
    const breakdown = calculateQuote(origin, destination, pkg);

    const shipment = await prisma.shipment.create({
      data: {
        customerId: customer!.id,
        originLabel: origin.label,
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLabel: destination.label,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        weightKg: pkg.weightKg,
        lengthCm: pkg.lengthCm,
        widthCm: pkg.widthCm,
        heightCm: pkg.heightCm,
        distanceKm: breakdown.distanceKm,
        priceCents: breakdown.priceCents,
        currency: breakdown.currency,
        currentLat: origin.lat,
        currentLng: origin.lng,
      },
    });

    rows.push({ row: rowNumber, status: "accepted", shipmentId: shipment.id });
  }

  const accepted = rows.filter((r) => r.status === "accepted").length;
  const rejected = rows.length - accepted;

  await recordAudit(actorId, "shipment.csv_import", {
    targetType: "shipment",
    metadata: { totalRows: rows.length, accepted, rejected },
  });

  return { totalRows: rows.length, accepted, rejected, rows };
}

function envFlag(name: string): boolean {
  return process.env[name] === "true";
}

export function getFeatureFlags(): FeatureFlags {
  return Object.fromEntries(
    FEATURE_FLAG_KEYS.map((key) => [key, envFlag(`FEATURE_${key.replace(/([A-Z])/g, "_$1").toUpperCase()}`)]),
  ) as FeatureFlags;
}
