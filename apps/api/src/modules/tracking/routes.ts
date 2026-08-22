import type { FastifyInstance } from "fastify";
import { listTrackingQuerySchema } from "./schema.js";
import * as trackingService from "./service.js";
import { registerConnection, broadcastShipmentUpdate } from "./ws.js";
import { authenticate, requireRole } from "../auth/middleware.js";
import { verifyAccessToken } from "../../core/jwt.js";
import { ApiError } from "../../core/errors.js";
import { registerFlakeHook } from "../../core/flake.js";

export async function trackingRoutes(app: FastifyInstance) {
  registerFlakeHook(app, "tracking");

  // Data table backing the dashboard (FR-803): sort, filter by status, paginate.
  app.get("/", { preHandler: authenticate }, async (request, reply) => {
    const parsed = listTrackingQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw ApiError.validation("Invalid tracking query", parsed.error.flatten());
    }
    reply.send(await trackingService.listTracking(request.auth!.userId, request.auth!.role, parsed.data));
  });

  // CSV export of the same listing (FR-803), same filters, unpaginated.
  app.get<{ Querystring: Record<string, string> }>("/export.csv", { preHandler: authenticate }, async (request, reply) => {
    const parsed = listTrackingQuerySchema.safeParse({ ...request.query, page: 1, pageSize: 100 });
    if (!parsed.success) {
      throw ApiError.validation("Invalid tracking query", parsed.error.flatten());
    }
    const { items } = await trackingService.listTracking(request.auth!.userId, request.auth!.role, parsed.data);
    reply.header("Content-Type", "text/csv").header("Content-Disposition", 'attachment; filename="shipments.csv"');
    reply.send(trackingService.toCsv(items));
  });

  app.get<{ Params: { id: string } }>("/:id", { preHandler: authenticate }, async (request, reply) => {
    const shipment = await trackingService.getTracking(request.params.id, request.auth!.userId, request.auth!.role);
    reply.send({ shipment });
  });

  // Manually advances a shipment one simulation tick (FR-801) — dispatcher/admin only.
  app.post<{ Params: { id: string } }>(
    "/:id/advance",
    { preHandler: [authenticate, requireRole("dispatcher", "admin")] },
    async (request, reply) => {
      const shipment = await trackingService.advanceShipment(request.params.id, request.auth!.userId, request.auth!.role);
      broadcastShipmentUpdate(shipment);
      reply.send({ shipment });
    },
  );

  // Real-time status/position feed (FR-801/FR-802). Auth can't use a bearer header
  // on a browser WebSocket upgrade, so the access token travels as a query param.
  app.get<{ Querystring: { token?: string } }>("/ws", { websocket: true }, (socket, request) => {
    const token = request.query.token;
    if (!token) {
      socket.close(4001, "Missing access token");
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      registerConnection(socket, payload.sub, payload.role);
      socket.send(JSON.stringify({ type: "connected" }));
    } catch {
      socket.close(4001, "Invalid or expired access token");
    }
  });
}
