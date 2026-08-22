import type { FastifyInstance } from "fastify";
import { thAuthRoutes } from "./authRoutes.js";
import { thChallengesRoutes } from "./challengesRoutes.js";
import { thLeaderboardRoutes } from "./leaderboardRoutes.js";
import { thDiscussionRoutes } from "./discussionRoutes.js";
import { registerFlakeHook } from "../../core/flake.js";

// AssertQuest platform layer — Challenge Board, challenge pages, profile,
// leaderboard, community discussion. Registered at /api/th, entirely separate
// from SwiftCargo's own /api/* routes (different account system, see jwt.ts).
export async function thPlatformRoutes(app: FastifyInstance) {
  registerFlakeHook(app, "thPlatform");

  app.register(thAuthRoutes, { prefix: "/auth" });
  app.register(thChallengesRoutes, { prefix: "/challenges" });
  app.register(thLeaderboardRoutes);
  app.register(thDiscussionRoutes, { prefix: "/discussion" });
}
