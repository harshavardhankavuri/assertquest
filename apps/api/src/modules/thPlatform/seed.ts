import argon2 from "argon2";
import { prisma } from "../../core/db.js";
import { registerModule } from "../../core/moduleRegistry.js";
import { generateDisplayName } from "./displayName.js";

// Demo AssertQuest platform accounts — distinct from SwiftCargo's own demo
// accounts (docs/self-host.md). Shared password is intentional: this is a
// practice sandbox, no real learner data is ever stored here.
export const DEMO_TH_PASSWORD = "LearnTest123!";

const DEMO_TH_USERS: { email: string; role: "learner" | "admin" }[] = [
  { email: "learner@assertquest.dev", role: "learner" },
  { email: "th-admin@assertquest.dev", role: "admin" },
];

async function seedUsers() {
  const passwordHash = await argon2.hash(DEMO_TH_PASSWORD);
  for (const demo of DEMO_TH_USERS) {
    await prisma.tHUser.upsert({
      where: { email: demo.email },
      update: {},
      create: { email: demo.email, role: demo.role, passwordHash, displayName: generateDisplayName() },
    });
  }
}

// Gives the demo learner one cleared challenge, so the leaderboard/profile pages
// aren't empty on a fresh self-hosted instance. Best-effort: skipped if that
// challenge hasn't been seeded yet (module load order isn't guaranteed).
async function seedSampleProgress() {
  const learner = await prisma.tHUser.findUnique({ where: { email: "learner@assertquest.dev" } });
  const challenge = await prisma.tHChallenge.findUnique({ where: { id: "auth-light-first-voyage" } });
  if (!learner || !challenge) return;

  await prisma.tHProgress.upsert({
    where: { userId_challengeId: { userId: learner.id, challengeId: challenge.id } },
    update: {},
    create: { userId: learner.id, challengeId: challenge.id, status: "cleared", clearedAt: new Date() },
  });
}

async function seed() {
  await seedUsers();
  await seedSampleProgress();
}

async function reset() {
  const emails = DEMO_TH_USERS.map((u) => u.email);
  await prisma.tHUser.deleteMany({ where: { email: { in: emails } } });
  await seedUsers();
  await seedSampleProgress();
}

registerModule("thPlatform", { seed, reset });

export { seed as seedThPlatform, reset as resetThPlatform };
