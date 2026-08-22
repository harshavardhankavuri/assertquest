import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { getModule } from "../src/core/moduleRegistry.js";
import { prisma } from "../src/core/db.js";
import { DEMO_PASSWORD } from "../src/modules/auth/seed.js";
import type { FastifyInstance } from "fastify";

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

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await getModule("auth")!.reset();
  await getModule("booking")!.reset();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("booking-light-fair-passage: pricing calculator", () => {
  it("computes priceCents as the sum of the fee breakdown", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/booking/quote",
      payload: { origin: ORIGIN, destination: DESTINATION, package: PACKAGE },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.priceCents).toBe(body.baseFeeCents + body.weightFeeCents + body.distanceFeeCents);
  });
});

describe("booking-heavy-padded-invoice: server ignores client-supplied price", () => {
  it("recomputes the price server-side instead of trusting the request body", async () => {
    const accessToken = await loginAsCustomer(app);

    const quoteRes = await app.inject({
      method: "POST",
      url: "/api/booking/quote",
      payload: { origin: ORIGIN, destination: DESTINATION, package: PACKAGE },
    });
    const expectedPriceCents = quoteRes.json().priceCents as number;

    const bookRes = await app.inject({
      method: "POST",
      url: "/api/booking",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        origin: ORIGIN,
        destination: DESTINATION,
        package: PACKAGE,
        priceCents: 1, // tampered — must be ignored
      },
    });

    expect(bookRes.statusCode).toBe(201);
    expect(bookRes.json().shipment.priceCents).toBe(expectedPriceCents);
  });
});

describe("booking-bulk-customs-hold: document upload validation", () => {
  it("rejects disallowed types and oversized files, accepts a valid one, and persists only the accepted document", async () => {
    const accessToken = await loginAsCustomer(app);

    const bookRes = await app.inject({
      method: "POST",
      url: "/api/booking",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { origin: ORIGIN, destination: DESTINATION, package: PACKAGE },
    });
    const shipmentId = bookRes.json().shipment.id as string;

    function multipartPayload(filename: string, contentType: string, content: Buffer) {
      const boundary = "----assertquestBoundary";
      const head = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`,
      );
      const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
      return {
        boundary,
        body: Buffer.concat([head, content, tail]),
      };
    }

    // Disallowed MIME type
    const disallowed = multipartPayload("notes.txt", "text/plain", Buffer.from("plain text"));
    const disallowedRes = await app.inject({
      method: "POST",
      url: `/api/booking/${shipmentId}/documents`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": `multipart/form-data; boundary=${disallowed.boundary}`,
      },
      payload: disallowed.body,
    });
    expect(disallowedRes.statusCode).toBe(400);
    expect(disallowedRes.json().error.code).toBe("VALIDATION_ERROR");

    // Oversized file (over 5MB)
    const oversized = multipartPayload("scan.pdf", "application/pdf", Buffer.alloc(6 * 1024 * 1024, 1));
    const oversizedRes = await app.inject({
      method: "POST",
      url: `/api/booking/${shipmentId}/documents`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": `multipart/form-data; boundary=${oversized.boundary}`,
      },
      payload: oversized.body,
    });
    expect(oversizedRes.statusCode).toBe(400);
    expect(oversizedRes.json().error.code).toBe("VALIDATION_ERROR");

    // Valid file
    const valid = multipartPayload("customs-form.pdf", "application/pdf", Buffer.from("%PDF-1.4 fake pdf content"));
    const validRes = await app.inject({
      method: "POST",
      url: `/api/booking/${shipmentId}/documents`,
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": `multipart/form-data; boundary=${valid.boundary}`,
      },
      payload: valid.body,
    });
    expect(validRes.statusCode).toBe(201);

    const listRes = await app.inject({
      method: "GET",
      url: `/api/booking/${shipmentId}/documents`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const documents = listRes.json().documents as { filename: string }[];
    expect(documents).toHaveLength(1);
    expect(documents[0].filename).toBe("customs-form.pdf");
  });
});
