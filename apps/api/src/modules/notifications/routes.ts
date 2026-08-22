import type { FastifyInstance } from "fastify";
import * as notificationsService from "./service.js";
import { authenticate, requireRole } from "../auth/middleware.js";
import { registerFlakeHook } from "../../core/flake.js";

export async function notificationsRoutes(app: FastifyInstance) {
  registerFlakeHook(app, "notifications");
  app.addHook("preHandler", authenticate);

  // In-app notification center (FR-1202).
  app.get("/", async (request, reply) => {
    reply.send(await notificationsService.listNotifications(request.auth!.userId));
  });

  app.post<{ Params: { id: string } }>("/:id/read", async (request, reply) => {
    const notification = await notificationsService.markRead(request.params.id, request.auth!.userId);
    reply.send({ notification });
  });

  app.post("/read-all", async (request, reply) => {
    const count = await notificationsService.markAllRead(request.auth!.userId);
    reply.send({ marked: count });
  });

  // Mock email/SMS outbox (FR-1201) — a Mailhog-style viewable inbox for test
  // assertions, not a real inbox. Admin-only: it can show every user's messages.
  app.get<{ Querystring: { to?: string } }>("/outbox", { preHandler: requireRole("admin") }, async (request, reply) => {
    reply.send({ messages: await notificationsService.listOutbox(request.query.to) });
  });
}
