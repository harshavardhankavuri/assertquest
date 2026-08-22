import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { bulkActionSchema } from "./schema.js";
import * as adminService from "./service.js";
import { authenticate, requireRole } from "../auth/middleware.js";
import { ApiError } from "../../core/errors.js";
import { registerFlakeHook } from "../../core/flake.js";

// Admin Console (Module 6, FR-1101..FR-1104). Every route requires auth; most are
// admin-only, except GET /feature-flags — any authenticated user's UI can read
// flags to drive conditional rendering, not just the admin console itself.
export async function adminRoutes(app: FastifyInstance) {
  registerFlakeHook(app, "admin");
  await app.register(multipart);
  app.addHook("preHandler", authenticate);

  app.get("/feature-flags", async (_request, reply) => {
    reply.send({ flags: adminService.getFeatureFlags() });
  });

  app.get("/audit-log", { preHandler: requireRole("admin") }, async (_request, reply) => {
    reply.send({ entries: await adminService.listAuditLog() });
  });

  // Bulk approve/cancel (FR-1102) — always 200 with a per-item report; a failure on
  // one shipment id never blocks the others (see docs/api/admin.md).
  app.post("/shipments/bulk", { preHandler: requireRole("admin") }, async (request, reply) => {
    const parsed = bulkActionSchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid bulk action payload", parsed.error.flatten());
    }
    reply.send(await adminService.bulkShipmentAction(request.auth!.userId, parsed.data));
  });

  // CSV bulk import (FR-1103) — multipart with a single file field named "file".
  app.post("/shipments/import", { preHandler: requireRole("admin") }, async (request, reply) => {
    const uploaded = await request.file();
    if (!uploaded) {
      throw ApiError.validation("No file was uploaded");
    }
    const csvText = (await uploaded.toBuffer()).toString("utf-8");
    reply.send(await adminService.importShipmentsCsv(request.auth!.userId, csvText));
  });
}
