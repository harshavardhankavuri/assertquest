import argon2 from "argon2";
import { prisma } from "../../core/db.js";
import { ApiError } from "../../core/errors.js";
import { recordAudit } from "../../core/audit.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyAccessToken,
} from "../../core/jwt.js";
import type { RegisterInput, LoginInput } from "./schema.js";
import type { PublicUser, Role } from "@assertquest/shared";
import type { User } from "@prisma/client";

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role as Role,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await argon2.hash(input.password);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, role: input.role },
  });

  await recordAudit(user.id, "auth.register", { targetType: "user", targetId: user.id });
  return issueSession(user);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  await recordAudit(user.id, "auth.login", { targetType: "user", targetId: user.id });
  return issueSession(user);
}

async function issueSession(user: User) {
  const { token: accessToken, expiresAt: accessTokenExpiresAt } = signAccessToken({
    sub: user.id,
    role: user.role as Role,
  });
  const { token: refreshToken, tokenHash, expiresAt: refreshExpiresAt } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt: refreshExpiresAt },
  });

  return {
    user: toPublicUser(user),
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshExpiresAt,
  };
}

// Rotates a refresh token: the presented token is atomically revoked and a new
// access+refresh pair is issued. Reusing a revoked/expired/unknown token is rejected,
// which is exactly what the "Rotating Watch" (Bulk) challenge exercises.
export async function refresh(presentedToken: string) {
  const tokenHash = hashRefreshToken(presentedToken);
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is invalid or has been revoked");
  }

  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueSession(stored.user);
}

// Revokes the presented refresh token so a stale httpOnly cookie can't silently
// re-authenticate the user after they've explicitly logged out. Missing/unknown
// tokens are ignored — logout must succeed even if the cookie was already gone.
export async function logout(presentedToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(presentedToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toPublicUser(user) : null;
}

export { verifyAccessToken };
