import type { FastifyRequest, FastifyReply } from "fastify";
import type { Role } from "@assertquest/shared";
import { ApiError } from "../../core/errors.js";
import { verifyAccessToken } from "../../core/jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    auth?: { userId: string; role: Role };
  }
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing bearer token");
  }
  const payload = verifyAccessToken(header.slice("Bearer ".length));
  request.auth = { userId: payload.sub, role: payload.role };
}

export function requireRole(...roles: Role[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.auth) {
      throw ApiError.unauthorized();
    }
    if (!roles.includes(request.auth.role)) {
      throw ApiError.forbidden(`This action requires one of: ${roles.join(", ")}`);
    }
  };
}
