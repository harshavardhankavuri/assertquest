import type { FastifyInstance } from "fastify";
import { registerSchema, loginSchema } from "./schema.js";
import * as authService from "./service.js";
import { authenticate, requireRole } from "./middleware.js";
import { ApiError } from "../../core/errors.js";
import { REFRESH_COOKIE_NAME, REFRESH_TOKEN_TTL_SECONDS } from "../../core/jwt.js";
import { registerFlakeHook } from "../../core/flake.js";
import type { AuthResponse } from "@assertquest/shared";

function setRefreshCookie(reply: import("fastify").FastifyReply, token: string) {
  reply.setCookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  });
}

export async function authRoutes(app: FastifyInstance) {
  registerFlakeHook(app, "auth");

  app.post("/register", async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid registration payload", parsed.error.flatten());
    }
    const session = await authService.register(parsed.data);
    setRefreshCookie(reply, session.refreshToken);
    const body: AuthResponse = {
      user: session.user,
      tokens: { accessToken: session.accessToken, accessTokenExpiresAt: session.accessTokenExpiresAt.toISOString() },
    };
    reply.code(201).send(body);
  });

  app.post("/login", async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw ApiError.validation("Invalid login payload", parsed.error.flatten());
    }
    const session = await authService.login(parsed.data);
    setRefreshCookie(reply, session.refreshToken);
    const body: AuthResponse = {
      user: session.user,
      tokens: { accessToken: session.accessToken, accessTokenExpiresAt: session.accessTokenExpiresAt.toISOString() },
    };
    reply.send(body);
  });

  app.post("/refresh", async (request, reply) => {
    const presentedToken = request.cookies[REFRESH_COOKIE_NAME];
    if (!presentedToken) {
      throw ApiError.unauthorized("No refresh token present");
    }
    const session = await authService.refresh(presentedToken);
    setRefreshCookie(reply, session.refreshToken);
    const body: AuthResponse = {
      user: session.user,
      tokens: { accessToken: session.accessToken, accessTokenExpiresAt: session.accessTokenExpiresAt.toISOString() },
    };
    reply.send(body);
  });

  app.post("/logout", async (request, reply) => {
    const presentedToken = request.cookies[REFRESH_COOKIE_NAME];
    if (presentedToken) {
      await authService.logout(presentedToken);
    }
    reply.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    reply.code(204).send();
  });

  app.get("/me", { preHandler: authenticate }, async (request, reply) => {
    const user = await authService.getUserById(request.auth!.userId);
    if (!user) throw ApiError.notFound("User not found");
    reply.send({ user });
  });

  // Example admin-only resource, used by the "Wrong Manifest" (Heavy) challenge to
  // exercise 403 behavior. Future modules will add their own real protected routes.
  app.get("/admin-check", { preHandler: [authenticate, requireRole("admin")] }, async (_request, reply) => {
    reply.send({ ok: true });
  });

  // Google OAuth is Should-priority (FR-603) and requires real OAuth client
  // credentials to complete; scaffolded and gated off until configured.
  app.get("/google", async (_request, _reply) => {
    if (process.env.GOOGLE_OAUTH_ENABLED !== "true") {
      throw new ApiError("NOT_FOUND", 404, "Google OAuth login is not enabled on this instance");
    }
    throw new ApiError("INTERNAL_ERROR", 501, "Google OAuth flow is not yet implemented");
  });
}
