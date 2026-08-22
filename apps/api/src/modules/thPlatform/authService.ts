import argon2 from "argon2";
import { prisma } from "../../core/db.js";
import { ApiError } from "../../core/errors.js";
import { signAccessToken } from "./jwt.js";
import { generateDisplayName } from "./displayName.js";
import type { RegisterInput, LoginInput, UpdateProfileInput } from "./authSchema.js";
import type { THUser, THAuthResponse } from "@assertquest/shared";
import type { THUser as PrismaTHUser } from "@prisma/client";

function toPublicUser(user: PrismaTHUser): THUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    publicRealName: user.publicRealName,
    role: user.role as THUser["role"],
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(input: RegisterInput): Promise<THAuthResponse> {
  const existing = await prisma.tHUser.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("An account with this email already exists");
  }

  const passwordHash = await argon2.hash(input.password);
  const user = await prisma.tHUser.create({
    data: { email: input.email, passwordHash, displayName: generateDisplayName() },
  });

  return { user: toPublicUser(user), accessToken: signAccessToken({ sub: user.id, role: user.role as THUser["role"] }) };
}

export async function login(input: LoginInput): Promise<THAuthResponse> {
  const user = await prisma.tHUser.findUnique({ where: { email: input.email } });
  if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  return { user: toPublicUser(user), accessToken: signAccessToken({ sub: user.id, role: user.role as THUser["role"] }) };
}

export async function getUserById(id: string): Promise<THUser | null> {
  const user = await prisma.tHUser.findUnique({ where: { id } });
  return user ? toPublicUser(user) : null;
}

export async function updateProfile(id: string, input: UpdateProfileInput): Promise<THUser> {
  const user = await prisma.tHUser.update({ where: { id }, data: input });
  return toPublicUser(user);
}
