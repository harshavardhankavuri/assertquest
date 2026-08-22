import type { FastifyInstance } from "fastify";
import { leaderboardQuerySchema } from "./leaderboardSchema.js";
import * as leaderboardService from "./leaderboardService.js";
import * as challengesService from "./challengesService.js";
import { authenticate } from "./middleware.js";
import { ApiError } from "../../core/errors.js";

export async function thLeaderboardRoutes(app: FastifyInstance) {
  app.get("/leaderboard", async (request, reply) => {
    const parsed = leaderboardQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw ApiError.validation("Invalid leaderboard query", parsed.error.flatten());
    }
    reply.send({ entries: await leaderboardService.getLeaderboard(parsed.data) });
  });

  app.get<{ Params: { userId: string } }>("/profile/:userId", async (request, reply) => {
    reply.send(await challengesService.getProfile(request.params.userId));
  });

  app.get<{ Querystring: { limit?: string } }>("/activity", async (request, reply) => {
    const limit = request.query.limit ? Number(request.query.limit) : undefined;
    reply.send({ entries: await leaderboardService.getRecentActivity(limit) });
  });

  // Resets only the caller's own progress (FR-104) — never another user's.
  app.post<{ Querystring: { module?: string } }>(
    "/profile/me/reset-progress",
    { preHandler: authenticate },
    async (request, reply) => {
      await challengesService.resetProgress(request.thAuth!.userId, request.query.module);
      reply.send({ reset: true, module: request.query.module ?? "all" });
    },
  );
}
