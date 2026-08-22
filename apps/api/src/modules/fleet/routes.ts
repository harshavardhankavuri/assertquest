import type { FastifyInstance } from "fastify";
import { upsertAssignmentSchema } from "./schema.js";
import * as fleetService from "./service.js";
import { authenticate, requireRole } from "../auth/middleware.js";
import { ApiError } from "../../core/errors.js";
import { registerFlakeHook } from "../../core/flake.js";

// Fleet & Scheduling (Module 4, FR-901..FR-903) — dispatcher/admin only throughout,
// since this is the dispatch team's own scheduling tool, not customer-facing.
export async function fleetRoutes(app: FastifyInstance) {
  registerFlakeHook(app, "fleet");
  app.addHook("preHandler", authenticate);
  app.addHook("preHandler", requireRole("dispatcher", "admin"));

  app.get("/vehicles", async (_request, reply) => {
    reply.send({ vehicles: await fleetService.listVehicles() });
  });

  app.get("/drivers", async (_request, reply) => {
    reply.send({ drivers: await fleetService.listDrivers() });
  });

  app.get("/assignments", async (_request, reply) => {
    reply.send({ assignments: await fleetService.listAssignments() });
  });

  // Upsert by shipment id: the Kanban board (FR-901) calls this on every drag-drop,
  // whether the shipment is being assigned for the first time or moved to a
  // different vehicle/driver/slot.
  app.put<{ Params: { shipmentId: string } }>("/assignments/:shipmentId", async (request, reply) => {
    const parsed = upsertAssignmentSchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid assignment payload", parsed.error.flatten());
    }
    const assignment = await fleetService.upsertAssignment(request.params.shipmentId, parsed.data);
    reply.send({ assignment });
  });

  app.delete<{ Params: { id: string } }>("/assignments/:id", async (request, reply) => {
    await fleetService.deleteAssignment(request.params.id);
    reply.code(204).send();
  });

  // Conflict detection (FR-902), consumed by the board/calendar to render a visible
  // warning (FR-903) rather than letting a double-booking pass unnoticed.
  app.get("/conflicts", async (_request, reply) => {
    reply.send({ conflicts: await fleetService.getConflicts() });
  });
}
