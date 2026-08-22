import argon2 from "argon2";
import { prisma } from "../../core/db.js";
import { registerModule } from "../../core/moduleRegistry.js";
import { loadModuleChallenges } from "../../challenges/manifest.js";
import type { Role } from "@assertquest/shared";

// Known password for every seeded demo account — documented in docs/self-host.md.
// This is a practice sandbox with no real user data, so a shared demo credential is fine.
export const DEMO_PASSWORD = "Password123!";

const DEMO_USERS: { email: string; role: Role }[] = [
  { email: "admin@swiftcargo.test", role: "admin" },
  { email: "dispatcher@swiftcargo.test", role: "dispatcher" },
  { email: "driver@swiftcargo.test", role: "driver" },
  { email: "customer@swiftcargo.test", role: "customer" },
];

async function seedUsers() {
  const passwordHash = await argon2.hash(DEMO_PASSWORD);
  for (const demo of DEMO_USERS) {
    await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: { email: demo.email, role: demo.role, passwordHash },
    });
  }
}

async function seedChallenges() {
  const challenges = await loadModuleChallenges("auth");
  for (const c of challenges) {
    await prisma.tHChallenge.upsert({
      where: { id: c.id },
      update: {
        module: c.module,
        title: c.title,
        difficulty: c.difficulty,
        surfaceTags: c.surfaceTags,
        estimatedMinutes: c.estimatedMinutes,
        description: c.description,
        successCondition: c.successCondition,
        hints: c.hints,
      },
      create: {
        id: c.id,
        module: c.module,
        title: c.title,
        difficulty: c.difficulty,
        surfaceTags: c.surfaceTags,
        estimatedMinutes: c.estimatedMinutes,
        description: c.description,
        successCondition: c.successCondition,
        hints: c.hints,
      },
    });
  }
}

async function seed() {
  await seedUsers();
  await seedChallenges();
}

async function reset() {
  await prisma.refreshToken.deleteMany({ where: { user: { email: { endsWith: "@swiftcargo.test" } } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: "@swiftcargo.test" } } });
  await seedUsers();
}

registerModule("auth", { seed, reset });

export { seed as seedAuth, reset as resetAuth };
