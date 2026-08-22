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

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await getModule("auth")!.reset();
  await getModule("booking")!.reset();
  await getModule("notifications")!.reset();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("notifications-light-return-to-sender: booking sends a mock email", () => {
  it("eventually appears in the admin outbox", async () => {
    const customerToken = await loginAs(app, "customer@swiftcargo.test");
    const adminToken = await loginAs(app, "admin@swiftcargo.test");
    await createShipment(app, customerToken);

    const found = await waitFor(async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/notifications/outbox?to=customer@swiftcargo.test",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const messages = res.json().messages as { channel: string; subject: string | null }[];
      return messages.find((m) => m.channel === "email" && m.subject === "Shipment booked");
    });

    expect(found).toBeTruthy();
  });
});

describe("notifications-standard-mark-as-read: read state persists", () => {
  it("marks a notification read and decreases the unread count", async () => {
    const customerToken = await loginAs(app, "customer@swiftcargo.test");
    await createShipment(app, customerToken);

    const notification = await waitFor(async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/notifications",
        headers: { authorization: `Bearer ${customerToken}` },
      });
      const body = res.json();
      return body.notifications.find((n: { type: string; read: boolean }) => n.type === "shipment.booked" && !n.read);
    });

    const before = await app.inject({
      method: "GET",
      url: "/api/notifications",
      headers: { authorization: `Bearer ${customerToken}` },
    });
    const unreadBefore = before.json().unreadCount as number;

    const readRes = await app.inject({
      method: "POST",
      url: `/api/notifications/${notification.id}/read`,
      headers: { authorization: `Bearer ${customerToken}` },
    });
    expect(readRes.statusCode).toBe(200);
    expect(readRes.json().notification.read).toBe(true);

    const after = await app.inject({
      method: "GET",
      url: "/api/notifications",
      headers: { authorization: `Bearer ${customerToken}` },
    });
    expect(after.json().unreadCount).toBe(unreadBefore - 1);
    const persisted = after.json().notifications.find((n: { id: string }) => n.id === notification.id);
    expect(persisted.read).toBe(true);
  });
});

describe("notifications-heavy-slow-boat: delivery is queued, not synchronous", () => {
  it("is not present immediately after the triggering request, but is shortly after", async () => {
    const customerToken = await loginAs(app, "customer@swiftcargo.test");

    const beforeCount = (
      await app.inject({ method: "GET", url: "/api/notifications", headers: { authorization: `Bearer ${customerToken}` } })
    ).json().notifications.length;

    const bookRes = await app.inject({
      method: "POST",
      url: "/api/booking",
      headers: { authorization: `Bearer ${customerToken}` },
      payload: { origin: ORIGIN, destination: DESTINATION, package: PACKAGE },
    });
    expect(bookRes.statusCode).toBe(201);

    // Immediately after: the notification must not have been written synchronously.
    const immediateCount = (
      await app.inject({ method: "GET", url: "/api/notifications", headers: { authorization: `Bearer ${customerToken}` } })
    ).json().notifications.length;
    expect(immediateCount).toBe(beforeCount);

    // Shortly after (past the queue delay): it has arrived.
    await waitFor(async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/notifications",
        headers: { authorization: `Bearer ${customerToken}` },
      });
      const notifications = res.json().notifications as unknown[];
      return notifications.length > beforeCount ? true : undefined;
    });
  });
});

describe("notifications-bulk-all-channels: delivery sends both email and sms, booking only email", () => {
  it("produces the right channel mix per event", async () => {
    const customerToken = await loginAs(app, "customer@swiftcargo.test");
    const dispatcherToken = await loginAs(app, "dispatcher@swiftcargo.test");
    const adminToken = await loginAs(app, "admin@swiftcargo.test");

    const shipment = await createShipment(app, customerToken);

    await waitFor(async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/notifications/outbox?to=customer@swiftcargo.test",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const messages = res.json().messages as { channel: string; subject: string | null }[];
      return messages.find((m) => m.channel === "email" && m.subject === "Shipment booked");
    });

    const afterBooking = await app.inject({
      method: "GET",
      url: "/api/notifications/outbox?to=customer@swiftcargo.test",
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const smsAfterBooking = afterBooking.json().messages.filter((m: { channel: string }) => m.channel === "sms");
    expect(smsAfterBooking).toHaveLength(0);

    // Walk the shipment to delivered (well within the simulator's convergence bound).
    let status = shipment.status;
    for (let i = 0; i < 20 && status !== "delivered"; i++) {
      const advanceRes = await app.inject({
        method: "POST",
        url: `/api/tracking/${shipment.id}/advance`,
        headers: { authorization: `Bearer ${dispatcherToken}` },
      });
      status = advanceRes.json().shipment.status;
    }
    expect(status).toBe("delivered");

    // SMS messages go to a mock phone number, not an email address, so they don't
    // show up under the ?to=<email> filter used above — check the full outbox.
    const smsFound = await waitFor(async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/notifications/outbox",
        headers: { authorization: `Bearer ${adminToken}` },
      });
      const messages = res.json().messages as { channel: string; body: string }[];
      return messages.find((m) => m.channel === "sms" && m.body.includes(shipment.id));
    });
    expect(smsFound).toBeTruthy();
  });
});
