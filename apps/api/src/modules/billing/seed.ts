import { prisma } from "../../core/db.js";
import { registerModule } from "../../core/moduleRegistry.js";
import { loadModuleChallenges } from "../../challenges/manifest.js";

// Billing doesn't own any records beyond its own challenge manifest entries —
// invoices/payments are created on demand against Module 2's shipments, and
// booking's reset() cascades away any invoices/payments on the shipments it deletes.
async function seedChallenges() {
  const challenges = await loadModuleChallenges("billing");
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

registerModule("billing", { seed, reset });

export { seed as seedBilling, reset as resetBilling };
