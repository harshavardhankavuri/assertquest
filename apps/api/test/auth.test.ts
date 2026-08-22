import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { getModule } from "../src/core/moduleRegistry.js";
import { prisma } from "../src/core/db.js";
import { DEMO_PASSWORD } from "../src/modules/auth/seed.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

function refreshCookieValue(response: { cookies: { name: string; value: string }[] }) {
  return response.cookies.find((c) => c.name === "th_refresh")?.value;
}

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  await getModule("auth")!.reset();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("auth-light-first-voyage: register + login", () => {
  it("registers a new user and logs in, receiving a valid access token", async () => {
    const email = `voyager-${Date.now()}@swiftcargo.test`;

    const registerRes = await app.inject({
      method: "POST",
      url: "/api/auth/register",
      payload: { email, password: "SafePassage123", role: "customer" },
    });
    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.json().tokens.accessToken).toBeTruthy();

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email, password: "SafePassage123" },
    });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.json().tokens.accessToken).toBeTruthy();
  });
});

describe("auth-standard-expired-papers: rejecting bad tokens", () => {
  it("returns 401 with a structured error for a malformed token", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { authorization: "Bearer not-a-real-token" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 TOKEN_EXPIRED for an expired token", async () => {
    const jwt = await import("jsonwebtoken");
    const expiredToken = jwt.default.sign(
      { sub: "does-not-matter", role: "customer" },
      process.env.ACCESS_TOKEN_SECRET ?? "dev-access-secret-change-me",
      { expiresIn: -10 },
    );
    const res = await app.inject({
      method: "GET",
      url: "/api/auth/me",
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("TOKEN_EXPIRED");
  });
});

describe("auth-heavy-wrong-manifest: role matrix on admin-only route", () => {
  const cases: { role: "admin" | "dispatcher" | "driver" | "customer"; expectAllowed: boolean }[] = [
    { role: "admin", expectAllowed: true },
    { role: "dispatcher", expectAllowed: false },
    { role: "driver", expectAllowed: false },
    { role: "customer", expectAllowed: false },
  ];

  it.each(cases)("role=$role expectAllowed=$expectAllowed", async ({ role, expectAllowed }) => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: `${role}@swiftcargo.test`, password: DEMO_PASSWORD },
    });
    expect(loginRes.statusCode).toBe(200);
    const accessToken = loginRes.json().tokens.accessToken;

    const res = await app.inject({
      method: "GET",
      url: "/api/auth/admin-check",
      headers: { authorization: `Bearer ${accessToken}` },
    });

    if (expectAllowed) {
      expect(res.statusCode).toBe(200);
    } else {
      expect(res.statusCode).toBe(403);
      expect(res.json().error.code).toBe("FORBIDDEN");
    }
  });
});

describe("auth-bulk-rotating-watch: refresh token rotation", () => {
  it("rotates the refresh token and rejects reuse of the original", async () => {
    const loginRes = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: "customer@swiftcargo.test", password: DEMO_PASSWORD },
    });
    const originalRefresh = refreshCookieValue(loginRes);
    expect(originalRefresh).toBeTruthy();

    const firstRefresh = await app.inject({
      method: "POST",
      url: "/api/auth/refresh",
      cookies: { th_refresh: originalRefresh! },
    });
    expect(firstRefresh.statusCode).toBe(200);
    const rotatedRefresh = refreshCookieValue(firstRefresh);
    expect(rotatedRefresh).toBeTruthy();
    expect(rotatedRefresh).not.toBe(originalRefresh);

    const reuseAttempt = await app.inject({
      method: "POST",
      url: "/api/auth/refresh",
      cookies: { th_refresh: originalRefresh! },
    });
    expect(reuseAttempt.statusCode).toBe(401);
    expect(reuseAttempt.json().error.code).toBe("UNAUTHORIZED");
  });
});
