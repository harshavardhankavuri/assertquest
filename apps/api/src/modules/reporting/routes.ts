import type { FastifyInstance } from "fastify";
import { reportQuerySchema } from "./schema.js";
import * as reportingService from "./service.js";
import { authenticate, requireRole } from "../auth/middleware.js";
import { ApiError } from "../../core/errors.js";
import { registerFlakeHook } from "../../core/flake.js";

// Reporting (Module 8, FR-1301..FR-1303) — dispatcher/admin only, this is a
// business analytics surface, not customer-facing.
export async function reportingRoutes(app: FastifyInstance) {
  registerFlakeHook(app, "reporting");
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("dispatcher", "admin"));

  // Synchronous chart data (FR-1301) — shipment volume and revenue over time,
  // bucketed by day or month in the requested timezone (FR-1302).
  app.get("/summary", async (request, reply) => {
    const parsed = reportQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw ApiError.validation("Invalid report query", parsed.error.flatten());
    }
    reply.send(await reportingService.getSummary(parsed.data));
  });

  // Scheduled report generation (FR-1303) — same query shape as /summary, but the
  // CSV is built asynchronously; poll GET /jobs/:id until status is "ready".
  app.post("/jobs", async (request, reply) => {
    const parsed = reportQuerySchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid report job payload", parsed.error.flatten());
    }
    const job = await reportingService.createReportJob(request.auth!.userId, parsed.data);
    reply.code(202).send({ job });
  });

  // Admins can see every dispatcher's scheduled reports; a dispatcher only their own.
  app.get<{ Params: { id: string } }>("/jobs/:id", async (request, reply) => {
    const job = await reportingService.getReportJob(
      request.params.id,
      request.auth!.userId,
      request.auth!.role === "admin",
    );
    reply.send({ job });
  });

  app.get<{ Params: { id: string } }>("/jobs/:id/download", async (request, reply) => {
    const csv = await reportingService.downloadReportJob(
      request.params.id,
      request.auth!.userId,
      request.auth!.role === "admin",
    );
    reply
      .header("Content-Type", "text/csv")
      .header("Content-Disposition", `attachment; filename="report-${request.params.id}.csv"`)
      .send(csv);
  });
}
