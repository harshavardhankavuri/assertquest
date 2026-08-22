import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { getModule } from "../src/core/moduleRegistry.js";
import { prisma } from "../src/core/db.js";
import { DEMO_PASSWORD } from "../src/modules/auth/seed.js";
import type { FastifyInstance } from "fastify";
import type { TrackingWsEvent, Shipment } from "@assertquest/shared";

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

async function createShipment(app: FastifyInstance, accessToken: string): Promise<Shipment> {
  const res = await app.inject({
    method: "POST",
    url: "/api/booking",
    headers: { authorization: `Bearer ${accessToken}` },
    payload: { origin: ORIGIN, destination: DESTINATION, package: PACKAGE },
  });
  return res.json().shipment as Shipment;
}

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await getModule("auth")!.reset();
  await getModule("booking")!.reset();
  await getModule("tracking")!.reset();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("tracking-light-sorted-manifest: sort, filter, paginate", () => {
  it("returns items sorted ascending by priceCents", async () => {
    const accessToken = await loginAs(app, "customer@swiftcargo.test");
    await createShipment(app, accessToken);
    await createShipment(app, accessToken);

    const res = await app.inject({
      method: "GET",
      url: "/api/tracking?sort=priceCents&order=asc&page=1&pageSize=5",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(5);
    const prices = body.items.map((s: Shipment) => s.priceCents);
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  });
});

describe("tracking-standard-live-wire: real-time updates over WebSocket", () => {
  it("broadcasts a tracking-update event when a shipment is advanced", async () => {
    const customerToken = await loginAs(app, "customer@swiftcargo.test");
    const dispatcherToken = await loginAs(app, "dispatcher@swiftcargo.test");
    const shipment = await createShipment(app, customerToken);

    const ws = await app.injectWS(`/api/tracking/ws?token=${customerToken}`);

    const updatePromise = new Promise<TrackingWsEvent>((resolve) => {
      ws.on("message", (data: Buffer) => {
        const event = JSON.parse(data.toString()) as TrackingWsEvent;
        if (event.type === "tracking-update") resolve(event);
      });
    });

    const advanceRes = await app.inject({
      method: "POST",
      url: `/api/tracking/${shipment.id}/advance`,
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    expect(advanceRes.statusCode).toBe(200);

    const event = await updatePromise;
    expect(event.type).toBe("tracking-update");
    if (event.type === "tracking-update") {
      expect(event.shipment.id).toBe(shipment.id);
      expect(event.shipment.status).toBe("in_transit");
    }
    ws.terminate();
  });
});

describe("tracking-heavy-ledger-export: CSV export matches the JSON listing", () => {
  it("returns a CSV whose rows correspond to the JSON listing", async () => {
    const accessToken = await loginAs(app, "customer@swiftcargo.test");
    const shipment = await createShipment(app, accessToken);

    const csvRes = await app.inject({
      method: "GET",
      url: "/api/tracking/export.csv",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(csvRes.statusCode).toBe(200);
    expect(csvRes.headers["content-type"]).toContain("text/csv");

    const lines = csvRes.body.trim().split("\n");
    expect(lines[0]).toBe("id,status,origin,destination,weightKg,distanceKm,priceCents,currency,createdAt");
    expect(lines.some((line) => line.startsWith(shipment.id))).toBe(true);

    const jsonRes = await app.inject({
      method: "GET",
      url: "/api/tracking?pageSize=100",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const items = jsonRes.json().items as Shipment[];
    expect(lines.length - 1).toBe(items.length);
  });
});
