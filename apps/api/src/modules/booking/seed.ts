import { prisma } from "../../core/db.js";
import { registerModule } from "../../core/moduleRegistry.js";
import { loadModuleChallenges } from "../../challenges/manifest.js";
import { calculateQuote } from "./pricing.js";
import type { ShipmentStatus } from "@assertquest/shared";

interface Port {
  label: string;
  lat: number;
  lng: number;
}

const PORTS: Port[] = [
  { label: "Port of Los Angeles, CA, USA", lat: 33.7395, lng: -118.2597 },
  { label: "Port of Rotterdam, Netherlands", lat: 51.9496, lng: 4.1453 },
  { label: "Port of Singapore", lat: 1.2644, lng: 103.84 },
  { label: "Port of Hamburg, Germany", lat: 53.5459, lng: 9.9714 },
  { label: "Port of Shanghai, China", lat: 31.2264, lng: 121.4998 },
  { label: "Port of New York/New Jersey, USA", lat: 40.6693, lng: -74.0446 },
  { label: "Port of Santos, Brazil", lat: -23.9608, lng: -46.3336 },
  { label: "Port of Dubai (Jebel Ali), UAE", lat: 25.0118, lng: 55.0617 },
];

// Deterministic pseudo-random so seed/reset always produce the same dataset —
// a real Math.random() would make demo screenshots and challenge assertions
// (e.g. "N shipments delivered this week") non-reproducible between resets.
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SHIPMENT_COUNT = 42;
// Weighted so the dashboard/reporting charts show a realistic funnel rather
// than an even split — most demo shipments have already completed transit.
const STATUS_WEIGHTS: [ShipmentStatus, number][] = [
  ["delivered", 0.55],
  ["in_transit", 0.2],
  ["booked", 0.17],
  ["cancelled", 0.08],
];

function pickStatus(rand: () => number): ShipmentStatus {
  const roll = rand();
  let cursor = 0;
  for (const [status, weight] of STATUS_WEIGHTS) {
    cursor += weight;
    if (roll <= cursor) return status;
  }
  return "booked";
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

async function seedShipments() {
  const customer = await prisma.user.findUnique({ where: { email: "customer@swiftcargo.test" } });
  if (!customer) return; // auth module seeds users first; nothing to attach to yet

  const existingCount = await prisma.shipment.count({ where: { customerId: customer.id } });
  if (existingCount >= SHIPMENT_COUNT) return;

  const rand = mulberry32(42);
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  for (let i = 0; i < SHIPMENT_COUNT; i++) {
    const origin = PORTS[Math.floor(rand() * PORTS.length)];
    let destination = PORTS[Math.floor(rand() * PORTS.length)];
    while (destination === origin) destination = PORTS[Math.floor(rand() * PORTS.length)];

    const pkg = {
      weightKg: Math.round(lerp(15, 4800, rand())),
      lengthCm: Math.round(lerp(30, 220, rand())),
      widthCm: Math.round(lerp(25, 180, rand())),
      heightCm: Math.round(lerp(20, 190, rand())),
    };
    const breakdown = calculateQuote(origin, destination, pkg);
    const status = pickStatus(rand);

    // Spread creation dates across the last 45 days, weighted toward "recent"
    // so the dashboard's 14-day chart has real variation instead of a flat line.
    const ageDays = Math.round(lerp(0, 45, rand() ** 1.4));
    const createdAt = new Date(now - ageDays * DAY_MS);

    const progress = status === "delivered" ? 1 : status === "in_transit" ? lerp(0.2, 0.85, rand()) : 0;
    const currentLat = lerp(origin.lat, destination.lat, progress);
    const currentLng = lerp(origin.lng, destination.lng, progress);

    await prisma.shipment.create({
      data: {
        customerId: customer.id,
        originLabel: origin.label,
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLabel: destination.label,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        weightKg: pkg.weightKg,
        lengthCm: pkg.lengthCm,
        widthCm: pkg.widthCm,
        heightCm: pkg.heightCm,
        distanceKm: breakdown.distanceKm,
        priceCents: breakdown.priceCents,
        currency: breakdown.currency,
        status,
        currentLat,
        currentLng,
        createdAt,
        positionUpdatedAt: createdAt,
      },
    });
  }
}

async function seedChallenges() {
  const challenges = await loadModuleChallenges("booking");
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
  await seedShipments();
  await seedChallenges();
}

async function reset() {
  const customer = await prisma.user.findUnique({ where: { email: "customer@swiftcargo.test" } });
  if (customer) {
    await prisma.shipment.deleteMany({ where: { customerId: customer.id } });
  }
  await seedShipments();
}

registerModule("booking", { seed, reset });

export { seed as seedBooking, reset as resetBooking };
