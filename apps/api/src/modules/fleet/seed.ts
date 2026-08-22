import { prisma } from "../../core/db.js";
import { registerModule } from "../../core/moduleRegistry.js";
import { loadModuleChallenges } from "../../challenges/manifest.js";
import type { VehicleType } from "@assertquest/shared";

const DEMO_VEHICLES: { label: string; type: VehicleType; capacityKg: number; plate: string }[] = [
  { label: "Van 1", type: "van", capacityKg: 800, plate: "SC-VAN-01" },
  { label: "Box Truck 1", type: "box_truck", capacityKg: 4500, plate: "SC-BOX-01" },
  { label: "Container Truck 1", type: "container_truck", capacityKg: 22000, plate: "SC-CTR-01" },
];

async function seedVehicles() {
  for (const v of DEMO_VEHICLES) {
    await prisma.vehicle.upsert({
      where: { plate: v.plate },
      update: { label: v.label, type: v.type, capacityKg: v.capacityKg },
      create: v,
    });
  }
}

async function seedChallenges() {
  const challenges = await loadModuleChallenges("fleet");
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
  await seedVehicles();
  await seedChallenges();
}

async function reset() {
  await prisma.assignment.deleteMany({});
  await seedVehicles();
  await seedChallenges();
}

registerModule("fleet", { seed, reset });

export { seed as seedFleet, reset as resetFleet };
