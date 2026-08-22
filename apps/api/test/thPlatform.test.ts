import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { getModule } from "../src/core/moduleRegistry.js";
import { prisma } from "../src/core/db.js";
import { DEMO_TH_PASSWORD } from "../src/modules/thPlatform/seed.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

async function registerAndLogin(app: FastifyInstance, email: string) {
  const res = await app.inject({
    method: "POST",
    url: "/api/th/auth/register",
    payload: { email, password: "PracticeMakesPerfect1" },
  });
  return res.json().accessToken as string;
}

async function loginDemoLearner(app: FastifyInstance) {
  const res = await app.inject({
    method: "POST",
    url: "/api/th/auth/login",
    payload: { email: "learner@assertquest.dev", password: DEMO_TH_PASSWORD },
  });
  return { accessToken: res.json().accessToken as string, userId: res.json().user.id as string };
}

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  // seed(), not reset(): this file is the first to depend on th_challenges rows
  // actually existing (e.g. "auth-light-first-voyage"), and auth's reset() only
  // re-seeds demo users, not its challenge manifest — seed() upserts both.
  await getModule("auth")!.seed();
  await getModule("thPlatform")!.reset();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("th platform auth", () => {
  it("registers, logs in, and reads its own profile via /me", async () => {
    const email = `voyager-${Date.now()}@example.test`;
    const registerRes = await app.inject({
      method: "POST",
      url: "/api/th/auth/register",
      payload: { email, password: "PracticeMakesPerfect1" },
    });
    expect(registerRes.statusCode).toBe(201);
    expect(registerRes.json().user.displayName).toBeTruthy();
    expect(registerRes.json().user.email).toBe(email);

    const loginRes = await app.inject({
      method: "POST",
      url: "/api/th/auth/login",
      payload: { email, password: "PracticeMakesPerfect1" },
    });
    expect(loginRes.statusCode).toBe(200);
    const accessToken = loginRes.json().accessToken;

    const meRes = await app.inject({ method: "GET", url: "/api/th/auth/me", headers: { authorization: `Bearer ${accessToken}` } });
    expect(meRes.statusCode).toBe(200);
    expect(meRes.json().user.email).toBe(email);
  });
});

describe("challenge board", () => {
  it("lists challenges, filterable by module, and is browsable anonymously", async () => {
    const res = await app.inject({ method: "GET", url: "/api/th/challenges?module=auth" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.challenges.length).toBeGreaterThan(0);
    expect(body.challenges.every((c: { module: string }) => c.module === "auth")).toBe(true);
    expect(body.challenges[0].status).toBeUndefined();
  });

  it("free-text searches across title and description", async () => {
    const res = await app.inject({ method: "GET", url: "/api/th/challenges?q=refresh" });
    expect(res.statusCode).toBe(200);
    expect(res.json().challenges.length).toBeGreaterThan(0);
  });

  it("shows personal status per row when authenticated", async () => {
    const accessToken = await registerAndLogin(app, `status-${Date.now()}@example.test`);
    const res = await app.inject({
      method: "GET",
      url: "/api/th/challenges?module=auth",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const body = res.json();
    expect(body.challenges.every((c: { status: string }) => c.status === "open")).toBe(true);
  });
});

describe("challenge detail, start, and clear", () => {
  it("tracks open -> in_progress -> cleared for the calling user", async () => {
    const accessToken = await registerAndLogin(app, `progress-${Date.now()}@example.test`);
    const challengeId = "auth-light-first-voyage";

    const initial = await app.inject({
      method: "GET",
      url: `/api/th/challenges/${challengeId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(initial.json().challenge.status).toBe("open");

    await app.inject({ method: "POST", url: `/api/th/challenges/${challengeId}/start`, headers: { authorization: `Bearer ${accessToken}` } });
    const afterStart = await app.inject({
      method: "GET",
      url: `/api/th/challenges/${challengeId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(afterStart.json().challenge.status).toBe("in_progress");

    await app.inject({ method: "POST", url: `/api/th/challenges/${challengeId}/clear`, headers: { authorization: `Bearer ${accessToken}` } });
    const afterClear = await app.inject({
      method: "GET",
      url: `/api/th/challenges/${challengeId}`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(afterClear.json().challenge.status).toBe("cleared");
  });

  it("reset delegates to the underlying SwiftCargo module's reset()", async () => {
    const res = await app.inject({ method: "POST", url: "/api/th/challenges/auth-light-first-voyage/reset" });
    expect(res.statusCode).toBe(200);
    expect(res.json().reset).toBe("auth-light-first-voyage");
  });

  it("404s for an unknown challenge id", async () => {
    const res = await app.inject({ method: "GET", url: "/api/th/challenges/does-not-exist" });
    expect(res.statusCode).toBe(404);
  });
});

describe("profile and per-module progress reset", () => {
  it("reflects cleared challenges in the profile summary, and resetting clears only that user", async () => {
    const { accessToken, userId } = await loginDemoLearner(app);

    const profileRes = await app.inject({ method: "GET", url: `/api/th/profile/${userId}` });
    expect(profileRes.statusCode).toBe(200);
    expect(profileRes.json().totalCleared).toBeGreaterThanOrEqual(1);

    const resetRes = await app.inject({
      method: "POST",
      url: "/api/th/profile/me/reset-progress",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(resetRes.statusCode).toBe(200);

    const profileAfter = await app.inject({ method: "GET", url: `/api/th/profile/${userId}` });
    expect(profileAfter.json().totalCleared).toBe(0);
  });
});

describe("leaderboard anonymization", () => {
  it("shows the anonymized displayName by default, and the email once opted in", async () => {
    const email = `leader-${Date.now()}@example.test`;
    const registerRes = await app.inject({
      method: "POST",
      url: "/api/th/auth/register",
      payload: { email, password: "PracticeMakesPerfect1" },
    });
    const accessToken = registerRes.json().accessToken;
    const userId = registerRes.json().user.id;
    const displayName = registerRes.json().user.displayName;

    await app.inject({ method: "POST", url: "/api/th/challenges/auth-light-first-voyage/clear", headers: { authorization: `Bearer ${accessToken}` } });

    const boardBefore = await app.inject({ method: "GET", url: "/api/th/leaderboard" });
    const entryBefore = boardBefore.json().entries.find((e: { userId: string }) => e.userId === userId);
    expect(entryBefore.name).toBe(displayName);

    await app.inject({
      method: "PATCH",
      url: "/api/th/auth/me",
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { publicRealName: true },
    });

    const boardAfter = await app.inject({ method: "GET", url: "/api/th/leaderboard" });
    const entryAfter = boardAfter.json().entries.find((e: { userId: string }) => e.userId === userId);
    expect(entryAfter.name).toBe(email);
  });
});

describe("discussion thread", () => {
  it("posts, lists, and upvotes", async () => {
    const accessToken = await registerAndLogin(app, `discuss-${Date.now()}@example.test`);
    const challengeId = "auth-light-first-voyage";

    const createRes = await app.inject({
      method: "POST",
      url: `/api/th/discussion/${challengeId}`,
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { body: "Here's how I solved it..." },
    });
    expect(createRes.statusCode).toBe(201);
    const postId = createRes.json().post.id;
    expect(createRes.json().post.upvotes).toBe(0);

    const listRes = await app.inject({ method: "GET", url: `/api/th/discussion/${challengeId}` });
    expect(listRes.json().posts.some((p: { id: string }) => p.id === postId)).toBe(true);

    const upvoteRes = await app.inject({
      method: "POST",
      url: `/api/th/discussion/posts/${postId}/upvote`,
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(upvoteRes.json().post.upvotes).toBe(1);
  });
});
