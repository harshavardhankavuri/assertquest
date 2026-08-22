import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { getModule } from "../src/core/moduleRegistry.js";
import { prisma } from "../src/core/db.js";
import { DEMO_PASSWORD } from "../src/modules/auth/seed.js";
import { DECLINED_TEST_CARD, TIMEOUT_TEST_CARD } from "../src/modules/billing/mockGateway.js";
import type { FastifyInstance } from "fastify";
import type { Shipment, Invoice } from "@assertquest/shared";

let app: FastifyInstance;

async function loginAsCustomer(app: FastifyInstance) {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email: "customer@swiftcargo.test", password: DEMO_PASSWORD },
  });
  return res.json().tokens.accessToken as string;
}

const ORIGIN = { label: "Port of Los Angeles, CA, USA", lat: 33.7395, lng: -118.2597 };
const DESTINATION = { label: "Port of Rotterdam, Netherlands", lat: 51.9496, lng: 4.1453 };
const PACKAGE = { weightKg: 100, lengthCm: 50, widthCm: 40, heightCm: 30 };
const VALID_CARD = "4242424242424242";

async function createShipment(app: FastifyInstance, accessToken: string): Promise<Shipment> {
  const res = await app.inject({
    method: "POST",
    url: "/api/booking",
    headers: { authorization: `Bearer ${accessToken}` },
    payload: { origin: ORIGIN, destination: DESTINATION, package: PACKAGE },
  });
  return res.json().shipment as Shipment;
}

async function createInvoice(app: FastifyInstance, accessToken: string, shipmentId: string, currency = "USD") {
  const res = await app.inject({
    method: "POST",
    url: `/api/billing/shipments/${shipmentId}/invoice`,
    headers: { authorization: `Bearer ${accessToken}` },
    payload: { currency },
  });
  return res.json().invoice as Invoice;
}

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await getModule("auth")!.reset();
  await getModule("booking")!.reset();
  await getModule("billing")!.reset();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("billing-light-exchange-rates: currency conversion rounding", () => {
  it("bills JPY as a whole number and EUR with 2 decimal places", async () => {
    const accessToken = await loginAsCustomer(app);
    const shipment = await createShipment(app, accessToken);
    const otherShipment = await createShipment(app, accessToken);

    const jpyInvoice = await createInvoice(app, accessToken, shipment.id, "JPY");
    expect(jpyInvoice.currency).toBe("JPY");
    expect(Number.isInteger(jpyInvoice.amountCents)).toBe(true);

    const eurInvoice = await createInvoice(app, accessToken, otherShipment.id, "EUR");
    expect(eurInvoice.currency).toBe("EUR");
    // A EUR amount converted from a USD price with cents is very unlikely to land
    // on an exact multiple of 100 (whole euros) — this would only coincidentally
    // fail, which is an acceptable tradeoff for testing "has real minor-unit cents".
    expect(eurInvoice.amountCents % 100).not.toBe(0);
  });
});

describe("billing-standard-paper-trail: PDF export", () => {
  it("returns a well-formed PDF", async () => {
    const accessToken = await loginAsCustomer(app);
    const shipment = await createShipment(app, accessToken);
    const invoice = await createInvoice(app, accessToken, shipment.id);

    const res = await app.inject({
      method: "GET",
      url: `/api/billing/invoices/${invoice.id}/pdf`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
    expect(res.rawPayload.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });
});

describe("billing-heavy-declined-at-the-dock: gateway outcome matrix", () => {
  it("handles success, decline, and timeout distinctly", async () => {
    const accessToken = await loginAsCustomer(app);

    const declineShipment = await createShipment(app, accessToken);
    const declineInvoice = await createInvoice(app, accessToken, declineShipment.id);
    const declineRes = await app.inject({
      method: "POST",
      url: `/api/billing/invoices/${declineInvoice.id}/pay`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { cardNumber: DECLINED_TEST_CARD },
    });
    expect(declineRes.json().payment.status).toBe("declined");
    expect(declineRes.json().invoice.status).toBe("open");

    const timeoutShipment = await createShipment(app, accessToken);
    const timeoutInvoice = await createInvoice(app, accessToken, timeoutShipment.id);
    const timeoutRes = await app.inject({
      method: "POST",
      url: `/api/billing/invoices/${timeoutInvoice.id}/pay`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { cardNumber: TIMEOUT_TEST_CARD },
    });
    expect(timeoutRes.json().payment.status).toBe("timed_out");
    expect(timeoutRes.json().invoice.status).toBe("open");

    const successShipment = await createShipment(app, accessToken);
    const successInvoice = await createInvoice(app, accessToken, successShipment.id);
    const successRes = await app.inject({
      method: "POST",
      url: `/api/billing/invoices/${successInvoice.id}/pay`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { cardNumber: VALID_CARD },
    });
    expect(successRes.json().payment.status).toBe("succeeded");
    expect(successRes.json().invoice.status).toBe("paid");
  });
});

describe("billing-bulk-second-attempt: retry after decline", () => {
  it("preserves both attempts and ends up paid", async () => {
    const accessToken = await loginAsCustomer(app);
    const shipment = await createShipment(app, accessToken);
    const invoice = await createInvoice(app, accessToken, shipment.id);

    await app.inject({
      method: "POST",
      url: `/api/billing/invoices/${invoice.id}/pay`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { cardNumber: DECLINED_TEST_CARD },
    });
    await app.inject({
      method: "POST",
      url: `/api/billing/invoices/${invoice.id}/pay`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { cardNumber: VALID_CARD },
    });

    const paymentsRes = await app.inject({
      method: "GET",
      url: `/api/billing/invoices/${invoice.id}/payments`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const payments = paymentsRes.json().payments;
    expect(payments).toHaveLength(2);
    expect(payments[0]).toMatchObject({ attemptNumber: 1, status: "declined" });
    expect(payments[1]).toMatchObject({ attemptNumber: 2, status: "succeeded" });

    const invoiceRes = await app.inject({
      method: "GET",
      url: `/api/billing/invoices/${invoice.id}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(invoiceRes.json().invoice.status).toBe("paid");

    // Paying an already-paid invoice is rejected rather than silently accepted.
    const rePayRes = await app.inject({
      method: "POST",
      url: `/api/billing/invoices/${invoice.id}/pay`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { cardNumber: VALID_CARD },
    });
    expect(rePayRes.statusCode).toBe(409);
  });
});
