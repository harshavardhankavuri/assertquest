import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "node:crypto";
import type { Role } from "@assertquest/shared";
import { ApiError } from "./errors.js";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET ?? "dev-access-secret-change-me";
const ACCESS_TOKEN_TTL_SECONDS = Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 900); // 15m
const REFRESH_TOKEN_TTL_SECONDS = Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 7); // 7d

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): { token: string; expiresAt: Date } {
  const token = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_TTL_SECONDS });
  const expiresAt = new Date(Date.now() + ACCESS_TOKEN_TTL_SECONDS * 1000);
  return { token, expiresAt };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessTokenPayload & jwt.JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.tokenExpired();
    }
    throw ApiError.unauthorized("Invalid access token");
  }
}

export function generateRefreshToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(48).toString("hex");
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const REFRESH_COOKIE_NAME = "th_refresh";
export { REFRESH_TOKEN_TTL_SECONDS };
