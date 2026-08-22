import type { FastifyRequest, FastifyReply } from "fastify";
import { ApiError } from "../../core/errors.js";
import { verifyAccessToken } from "./jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    thAuth?: { userId: string; role: "learner" | "admin" };
  }
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("Missing bearer token");
  }
  const payload = verifyAccessToken(header.slice("Bearer ".length));
  request.thAuth = { userId: payload.sub, role: payload.role };
}

// The Challenge Board is browsable without an account (FR-101), but rows show
// personal status when the caller happens to be logged in (FR-206) — so auth
// here is opportunistic: a present-and-valid token is used, anything else
// (missing, malformed, expired) is silently treated as anonymous rather than
// rejected.
export async function optionalAuthenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return;
  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    request.thAuth = { userId: payload.sub, role: payload.role };
  } catch {
    // anonymous
  }
}

export function requireRole(...roles: ("learner" | "admin")[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.thAuth) throw ApiError.unauthorized();
    if (!roles.includes(request.thAuth.role)) {
      throw ApiError.forbidden(`This action requires one of: ${roles.join(", ")}`);
    }
  };
}
