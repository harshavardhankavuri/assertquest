import { prisma } from "../../core/db.js";
import { registerModule } from "../../core/moduleRegistry.js";
import { loadModuleChallenges } from "../../challenges/manifest.js";

// Tracking doesn't own any records of its own — it reads/updates the shipments
// Module 2 (Booking) creates. There's nothing to seed beyond this module's own
// challenge manifest entries; resetting shipment status/position back to "booked"
// at the origin is booking's reset() job.
async function seedChallenges() {
  const challenges = await loadModuleChallenges("tracking");
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
  await seedChallenges();
}

registerModule("tracking", { seed, reset });

export { seed as seedTracking, reset as resetTracking };
