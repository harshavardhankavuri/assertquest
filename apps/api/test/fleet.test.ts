import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { getModule } from "../src/core/moduleRegistry.js";
import { prisma } from "../src/core/db.js";
import { DEMO_PASSWORD } from "../src/modules/auth/seed.js";
import type { FastifyInstance } from "fastify";
import type { Shipment, Vehicle, FleetDriver } from "@assertquest/shared";

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

async function assign(
  app: FastifyInstance,
  dispatcherToken: string,
  shipmentId: string,
  vehicleId: string,
  driverId: string,
  startIso: string,
  endIso: string,
) {
  return app.inject({
    method: "PUT",
    url: `/api/fleet/assignments/${shipmentId}`,
    headers: { authorization: `Bearer ${dispatcherToken}` },
    payload: { vehicleId, driverId, scheduledStart: startIso, scheduledEnd: endIso },
  });
}

let dispatcherToken: string;
let customerToken: string;
let vehicles: Vehicle[];
let drivers: FleetDriver[];

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await getModule("auth")!.reset();
  await getModule("booking")!.reset();
  await getModule("fleet")!.reset();

  dispatcherToken = await loginAs(app, "dispatcher@swiftcargo.test");
  customerToken = await loginAs(app, "customer@swiftcargo.test");

  vehicles = (await app.inject({ method: "GET", url: "/api/fleet/vehicles", headers: { authorization: `Bearer ${dispatcherToken}` } })).json()
    .vehicles;
  drivers = (await app.inject({ method: "GET", url: "/api/fleet/drivers", headers: { authorization: `Bearer ${dispatcherToken}` } })).json()
    .drivers;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("fleet-light-loading-dock: assigning a shipment", () => {
  it("shows up in the assignment list after being assigned", async () => {
    const shipment = await createShipment(app, customerToken);
    const res = await assign(
      app,
      dispatcherToken,
      shipment.id,
      vehicles[0].id,
      drivers[0].id,
      "2026-09-01T08:00:00.000Z",
      "2026-09-01T10:00:00.000Z",
    );
    expect(res.statusCode).toBe(200);

    const listRes = await app.inject({
      method: "GET",
      url: "/api/fleet/assignments",
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    const assignments = listRes.json().assignments;
    expect(assignments.some((a: { shipmentId: string; vehicleId: string; driverId: string }) =>
      a.shipmentId === shipment.id && a.vehicleId === vehicles[0].id && a.driverId === drivers[0].id,
    )).toBe(true);
  });

  it("rejects non-dispatcher/admin roles", async () => {
    const shipment = await createShipment(app, customerToken);
    const res = await assign(
      app,
      customerToken,
      shipment.id,
      vehicles[0].id,
      drivers[0].id,
      "2026-09-01T08:00:00.000Z",
      "2026-09-01T10:00:00.000Z",
    );
    expect(res.statusCode).toBe(403);
  });
});

describe("fleet-standard-double-booked: conflict detection", () => {
  it("reports overlapping driver schedules", async () => {
    const shipmentA = await createShipment(app, customerToken);
    const shipmentB = await createShipment(app, customerToken);
    const driver = drivers[1] ?? drivers[0];

    const resA = await assign(
      app,
      dispatcherToken,
      shipmentA.id,
      vehicles[0].id,
      driver.id,
      "2026-09-02T08:00:00.000Z",
      "2026-09-02T10:00:00.000Z",
    );
    const resB = await assign(
      app,
      dispatcherToken,
      shipmentB.id,
      vehicles[1].id,
      driver.id,
      "2026-09-02T09:00:00.000Z",
      "2026-09-02T11:00:00.000Z",
    );
    const assignmentAId = resA.json().assignment.id;
    const assignmentBId = resB.json().assignment.id;

    const conflictsRes = await app.inject({
      method: "GET",
      url: "/api/fleet/conflicts",
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    const conflicts = conflictsRes.json().conflicts;
    expect(
      conflicts.some(
        (c: { resourceType: string; resourceId: string; assignmentIds: string[] }) =>
          c.resourceType === "driver" &&
          c.resourceId === driver.id &&
          c.assignmentIds.includes(assignmentAId) &&
          c.assignmentIds.includes(assignmentBId),
      ),
    ).toBe(true);
  });
});

describe("fleet-bulk-change-of-plans: reassignment resolves conflicts without duplicating rows", () => {
  it("moves the assignment instead of cloning it, and the conflict disappears", async () => {
    const shipmentA = await createShipment(app, customerToken);
    const shipmentB = await createShipment(app, customerToken);

    await assign(
      app,
      dispatcherToken,
      shipmentA.id,
      vehicles[0].id,
      drivers[0].id,
      "2026-09-03T08:00:00.000Z",
      "2026-09-03T10:00:00.000Z",
    );
    await assign(
      app,
      dispatcherToken,
      shipmentB.id,
      vehicles[0].id,
      drivers[1] ? drivers[1].id : drivers[0].id,
      "2026-09-03T09:00:00.000Z",
      "2026-09-03T11:00:00.000Z",
    );

    const conflictsBefore = (
      await app.inject({ method: "GET", url: "/api/fleet/conflicts", headers: { authorization: `Bearer ${dispatcherToken}` } })
    ).json().conflicts;
    expect(conflictsBefore.some((c: { resourceType: string; resourceId: string }) => c.resourceType === "vehicle" && c.resourceId === vehicles[0].id)).toBe(
      true,
    );

    // Reassign shipmentB to a different vehicle — resolves the vehicle conflict.
    await assign(
      app,
      dispatcherToken,
      shipmentB.id,
      vehicles[2].id,
      drivers[1] ? drivers[1].id : drivers[0].id,
      "2026-09-03T09:00:00.000Z",
      "2026-09-03T11:00:00.000Z",
    );

    const assignmentsRes = await app.inject({
      method: "GET",
      url: "/api/fleet/assignments",
      headers: { authorization: `Bearer ${dispatcherToken}` },
    });
    const rowsForShipmentB = assignmentsRes
      .json()
      .assignments.filter((a: { shipmentId: string }) => a.shipmentId === shipmentB.id);
    expect(rowsForShipmentB).toHaveLength(1);
    expect(rowsForShipmentB[0].vehicleId).toBe(vehicles[2].id);

    const conflictsAfter = (
      await app.inject({ method: "GET", url: "/api/fleet/conflicts", headers: { authorization: `Bearer ${dispatcherToken}` } })
    ).json().conflicts;
    expect(
      conflictsAfter.some((c: { resourceType: string; resourceId: string }) => c.resourceType === "vehicle" && c.resourceId === vehicles[0].id),
    ).toBe(false);
  });
});
