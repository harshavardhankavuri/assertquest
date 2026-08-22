import type { FastifyInstance } from "fastify";
import { listChallengesQuerySchema } from "./challengesSchema.js";
import * as challengesService from "./challengesService.js";
import { authenticate, optionalAuthenticate } from "./middleware.js";
import { ApiError } from "../../core/errors.js";

export async function thChallengesRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: optionalAuthenticate }, async (request, reply) => {
    const parsed = listChallengesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw ApiError.validation("Invalid challenge query", parsed.error.flatten());
    }
    reply.send(await challengesService.listChallenges(parsed.data, request.thAuth?.userId));
  });

  app.get<{ Params: { id: string } }>("/:id", { preHandler: optionalAuthenticate }, async (request, reply) => {
    const challenge = await challengesService.getChallenge(request.params.id, request.thAuth?.userId);
    reply.send({ challenge });
  });

  app.get<{ Params: { id: string } }>("/:id/related", async (request, reply) => {
    reply.send({ challenges: await challengesService.relatedChallenges(request.params.id) });
  });

  // No auth required — resetting a scenario is part of the practice sandbox, not
  // a privileged action (FR-305), consistent with /api/test/reset.
  app.post<{ Params: { id: string } }>("/:id/reset", async (request, reply) => {
    await challengesService.resetChallenge(request.params.id);
    reply.send({ reset: request.params.id });
  });

  app.post<{ Params: { id: string } }>("/:id/start", { preHandler: authenticate }, async (request, reply) => {
    await challengesService.startChallenge(request.params.id, request.thAuth!.userId);
    reply.code(204).send();
  });

  app.post<{ Params: { id: string } }>("/:id/clear", { preHandler: authenticate }, async (request, reply) => {
    await challengesService.clearChallenge(request.params.id, request.thAuth!.userId);
    reply.code(204).send();
  });
}
