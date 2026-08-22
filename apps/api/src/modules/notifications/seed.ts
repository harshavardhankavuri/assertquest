import { prisma } from "../../core/db.js";
import { registerModule } from "../../core/moduleRegistry.js";
import { loadModuleChallenges } from "../../challenges/manifest.js";

// Notifications/messages are created as a side effect of other modules' actions
// (booking, tracking, billing) rather than seeded directly — reset just clears
// whatever accumulated plus reseeds this module's own challenge manifest entries.
async function seedChallenges() {
  const challenges = await loadModuleChallenges("notifications");
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
  await seedChallenges();
}

async function reset() {
  await prisma.notification.deleteMany({});
  await prisma.mockMessage.deleteMany({});
  await seedChallenges();
}

registerModule("notifications", { seed, reset });

export { seed as seedNotifications, reset as resetNotifications };
