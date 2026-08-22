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

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await getModule("auth")!.reset();
  await getModule("booking")!.reset();
  await getModule("admin")!.reset();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("admin-light-behind-the-curtain: feature flags", () => {
  it("reports exactly the three known flags", async () => {
    const accessToken = await loginAs(app, "customer@swiftcargo.test");
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/feature-flags",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    const flags = res.json().flags;
    expect(Object.keys(flags).sort()).toEqual(["extendedTracking", "newAdminUi", "priorityLane"]);
    for (const value of Object.values(flags)) {
      expect(typeof value).toBe("boolean");
    }
  });
});

describe("admin-standard-who-what-when: audit log records login", () => {
  it("records an auth.login entry for the acting user", async () => {
    await loginAs(app, "customer@swiftcargo.test");
    const adminToken = await loginAs(app, "admin@swiftcargo.test");

    const res = await app.inject({
      method: "GET",
      url: "/api/admin/audit-log",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    expect(res.statusCode).toBe(200);
    const entries = res.json().entries;
    expect(
      entries.some((e: { action: string; actorEmail: string }) => e.action === "auth.login" && e.actorEmail === "customer@swiftcargo.test"),
    ).toBe(true);
  });

  it("rejects non-admin readers", async () => {
    const customerToken = await loginAs(app, "customer@swiftcargo.test");
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/audit-log",
      headers: { authorization: `Bearer ${customerToken}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe("admin-heavy-mixed-manifest: bulk cancel partial failure", () => {
  it("reports per-item success/failure without failing the whole batch", async () => {
    const customerToken = await loginAs(app, "customer@swiftcargo.test");
    const adminToken = await loginAs(app, "admin@swiftcargo.test");

    const openShipment = await createShipment(app, customerToken);
    const deliveredShipment = await createShipment(app, customerToken);
    await prisma.shipment.update({ where: { id: deliveredShipment.id }, data: { status: "delivered" } });

    const res = await app.inject({
      method: "POST",
      url: "/api/admin/shipments/bulk",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { action: "cancel", shipmentIds: [openShipment.id, "does-not-exist", deliveredShipment.id] },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.succeeded).toBe(1);
    expect(body.failed).toBe(2);

    const openResult = body.results.find((r: { shipmentId: string }) => r.shipmentId === openShipment.id);
    expect(openResult.success).toBe(true);
    const missingResult = body.results.find((r: { shipmentId: string }) => r.shipmentId === "does-not-exist");
    expect(missingResult.success).toBe(false);
    const deliveredResult = body.results.find((r: { shipmentId: string }) => r.shipmentId === deliveredShipment.id);
    expect(deliveredResult.success).toBe(false);

    const updated = await prisma.shipment.findUnique({ where: { id: openShipment.id } });
    expect(updated!.status).toBe("cancelled");
  });
});

describe("admin-bulk-cargo-manifest-upload: CSV import row validation", () => {
  it("accepts valid rows and rejects invalid ones independently", async () => {
    const adminToken = await loginAs(app, "admin@swiftcargo.test");

    const csv = [
      "customerEmail,originLabel,originLat,originLng,destinationLabel,destinationLat,destinationLng,weightKg,lengthCm,widthCm,heightCm",
      '"customer@swiftcargo.test","Port of Los Angeles, CA, USA",33.7395,-118.2597,"Port of Rotterdam, Netherlands",51.9496,4.1453,100,50,40,30',
      '"nobody@example.com","Port of Los Angeles, CA, USA",33.7395,-118.2597,"Port of Rotterdam, Netherlands",51.9496,4.1453,100,50,40,30',
      '"customer@swiftcargo.test","Port of Los Angeles, CA, USA",33.7395,-118.2597,"Port of Rotterdam, Netherlands",51.9496,4.1453,not-a-number,50,40,30',
    ].join("\n");

    const boundary = "----assertquestBoundary";
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="import.csv"\r\nContent-Type: text/csv\r\n\r\n`,
      ),
      Buffer.from(csv),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const res = await app.inject({
      method: "POST",
      url: "/api/admin/shipments/import",
      headers: { authorization: `Bearer ${adminToken}`, "content-type": `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    expect(res.statusCode).toBe(200);
    const report = res.json();
    expect(report.totalRows).toBe(3);
    expect(report.accepted).toBe(1);
    expect(report.rejected).toBe(2);
    expect(report.rows[0]).toMatchObject({ row: 2, status: "accepted" });
    expect(report.rows[1].status).toBe("rejected");
    expect(report.rows[2].status).toBe("rejected");
  });
});
