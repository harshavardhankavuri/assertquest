import jwt from "jsonwebtoken";
import { ApiError } from "../../core/errors.js";

// Deliberately separate from SwiftCargo's own auth (core/jwt.ts) — AssertQuest
// platform accounts (THUser) are a different account system from SwiftCargo
// accounts (User), so they get their own secret and their own, simpler session
// model: one longish-lived access token, no refresh-token rotation. Rotation is
// the teaching point of SwiftCargo's Module 1, not something the platform layer
// itself needs to re-demonstrate.
const ACCESS_TOKEN_SECRET = process.env.THP_ACCESS_TOKEN_SECRET ?? "dev-th-platform-secret-change-me";
const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.THP_ACCESS_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 7); // 7d

export interface THAccessTokenPayload {
  sub: string;
  role: "learner" | "admin";
}

export function signAccessToken(payload: THAccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
}

export function verifyAccessToken(token: string): THAccessTokenPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as THAccessTokenPayload & jwt.JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.tokenExpired();
    }
    throw ApiError.unauthorized("Invalid access token");
  }
}
