import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { getModule } from "../src/core/moduleRegistry.js";
import { prisma } from "../src/core/db.js";
import { DEMO_PASSWORD } from "../src/modules/auth/seed.js";
import type { FastifyInstance } from "fastify";
import type { Shipment } from "@assertquest/shared";

let app: FastifyInstance;

async function loginAs(app: FastifyInstance, email: string) {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password: DEMO_PASSWORD },
  });
  return res.json().tokens.accessToken as string;
}

const ORIGIN = { label: "Port of Los Angeles, CA, USA", lat: 33.7395, lng: -118.2597 };
const DESTINATION = { label: "Port of Rotterdam, Netherlands", lat: 51.9496, lng: 4.1453 };
const PACKAGE = { weightKg: 100, lengthCm: 50, widthCm: 40, heightCm: 30 };

async function createShipment(app: FastifyInstance, customerToken: string): Promise<Shipment> {
  const res = await app.inject({
    method: "POST",
    url: "/api/booking",
    headers: { authorization: `Bearer ${customerToken}` },
    payload: { origin: ORIGIN, destination: DESTINATION, package: PACKAGE },
  });
  return res.json().shipment as Shipment;
}

async function waitFor<T>(check: () => Promise<T | undefined>, timeoutMs = 3000, intervalMs = 25): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const result = await check();
    if (result !== undefined) return result;
    if (Date.now() > deadline) throw new Error("waitFor timed out");
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

let dispatcherToken: string;
let customerToken: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await getModule("auth")!.reset();
  await getModule("booking")!.reset();
  await getModule("reporting")!.reset();

  dispatcherToken = await loginAs(app, "dispatcher@swiftcargo.test");
  customerToken = await loginAs(app, "customer@swiftcargo.test");
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("reporting-light-ledger-at-a-glance: summary totals", () => {
  it("adds up shipment count and revenue for booked shipments", async () => {
    const from = new Date(Date.now() - 60_000).toISOString();
    const a = await createShipment(app, customerToken);
    const b = await createShipment(app, customerToken);
    const to = new Date(Date.now() + 60_000).toISOString();

    const res = await app.inject({
      method: "GET",
      url: `/api/reporting/summary?from=${from}&to=${to}&groupBy=day&timeZone=UTC`,
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.totalShipments).toBeGreaterThanOrEqual(2);
    expect(body.totalRevenueCents).toBeGreaterThanOrEqual(a.priceCents + b.priceCents);
  });
});

describe("reporting-standard-on-the-books: to is exclusive", () => {
  it("excludes a shipment created exactly at the to boundary, includes it 1ms later", async () => {
    const shipment = await createShipment(app, customerToken);
    const from = new Date(Date.now() - 60_000).toISOString();

    const exclusive = await app.inject({
      method: "GET",
      url: `/api/reporting/summary?from=${from}&to=${shipment.createdAt}&groupBy=day&timeZone=UTC`,
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    const idsExclusive = exclusive.json().totalShipments;

    const inclusive = await app.inject({
      method: "GET",
      url: `/api/reporting/summary?from=${from}&to=${new Date(new Date(shipment.createdAt).getTime() + 1).toISOString()}&groupBy=day&timeZone=UTC`,
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    const idsInclusive = inclusive.json().totalShipments;

    expect(idsInclusive).toBe(idsExclusive + 1);
  });
});

describe("reporting-heavy-midnight-in-rotterdam: timezone-aware bucketing", () => {
  it("buckets the same shipment under different days depending on timezone", async () => {
    const shipment = await createShipment(app, customerToken);
    await prisma.shipment.update({
      where: { id: shipment.id },
      data: { createdAt: new Date("2026-01-01T23:30:00.000Z") },
    });

    const from = "2026-01-01T00:00:00.000Z";
    const to = "2026-01-03T00:00:00.000Z";

    const utcRes = await app.inject({
      method: "GET",
      url: `/api/reporting/summary?from=${from}&to=${to}&groupBy=day&timeZone=UTC`,
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    const utcBuckets = utcRes.json().buckets;
    expect(utcBuckets.some((b: { period: string }) => b.period === "2026-01-01")).toBe(true);

    const farAheadRes = await app.inject({
      method: "GET",
      url: `/api/reporting/summary?from=${from}&to=${to}&groupBy=day&timeZone=Pacific/Kiritimati`,
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    const farAheadBuckets = farAheadRes.json().buckets;
    expect(farAheadBuckets.some((b: { period: string }) => b.period === "2026-01-02")).toBe(true);
  });
});

describe("reporting-bulk-special-delivery: async scheduled report", () => {
  it("goes through a not-ready state before becoming downloadable, matching the summary", async () => {
    await createShipment(app, customerToken);
    const from = new Date(Date.now() - 60_000).toISOString();
    const to = new Date(Date.now() + 60_000).toISOString();
    const query = { from, to, groupBy: "day" as const, timeZone: "UTC" };

    const createRes = await app.inject({
      method: "POST",
      url: "/api/reporting/jobs",
      headers: { authorization: `Bearer ${dispatcherToken}` },
      payload: query,
    });
    expect(createRes.statusCode).toBe(202);
    const jobId = createRes.json().job.id;
    expect(createRes.json().job.status).not.toBe("ready");

    // Not ready yet — download must be rejected.
    const tooEarly = await app.inject({
      method: "GET",
      url: `/api/reporting/jobs/${jobId}/download`,
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    expect(tooEarly.statusCode).toBe(409);

    await waitFor(async () => {
      const res = await app.inject({
        method: "GET",
        url: `/api/reporting/jobs/${jobId}`,
        headers: { authorization: `Bearer ${dispatcherToken}` },
      });
      return res.json().job.status === "ready" ? true : undefined;
    });

    const downloadRes = await app.inject({
      method: "GET",
      url: `/api/reporting/jobs/${jobId}/download`,
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    expect(downloadRes.statusCode).toBe(200);
    expect(downloadRes.headers["content-type"]).toBe("text/csv");
    const lines = downloadRes.body.trim().split("\n");
    expect(lines[0]).toBe("period,shipmentCount,revenueCents");

    const summaryRes = await app.inject({
      method: "GET",
      url: `/api/reporting/summary?from=${from}&to=${to}&groupBy=day&timeZone=UTC`,
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    const summary = summaryRes.json();
    expect(lines.length - 1).toBe(summary.buckets.length);
  });
});
