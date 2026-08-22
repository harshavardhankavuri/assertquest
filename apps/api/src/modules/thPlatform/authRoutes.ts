import type { FastifyInstance } from "fastify";
import { registerSchema, loginSchema, updateProfileSchema } from "./authSchema.js";
import * as authService from "./authService.js";
import { authenticate } from "./middleware.js";
import { ApiError } from "../../core/errors.js";

export async function thAuthRoutes(app: FastifyInstance) {
  app.post("/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid registration payload", parsed.error.flatten());
    }
    reply.code(201).send(await authService.register(parsed.data));
  });

  app.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid login payload", parsed.error.flatten());
    }
    reply.send(await authService.login(parsed.data));
  });

  app.get("/me", { preHandler: authenticate }, async (request, reply) => {
    const user = await authService.getUserById(request.thAuth!.userId);
    if (!user) throw ApiError.notFound("User not found");
    reply.send({ user });
  });

  // Opt-in to showing the account email (instead of the anonymized displayName)
  // on the leaderboard and in discussion posts (FR-403).
  app.patch("/me", { preHandler: authenticate }, async (request, reply) => {
    const parsed = updateProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid profile update", parsed.error.flatten());
    }
    reply.send({ user: await authService.updateProfile(request.thAuth!.userId, parsed.data) });
  });
}
