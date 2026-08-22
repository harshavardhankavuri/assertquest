import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from "../../src/core/jwt.js";
import { ApiError } from "../../src/core/errors.js";

describe("signAccessToken / verifyAccessToken", () => {
  it("round-trips a payload through sign and verify", () => {
    const { token, expiresAt } = signAccessToken({ sub: "user-1", role: "driver" });

    expect(typeof token).toBe("string");
    expect(expiresAt).toBeInstanceOf(Date);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe("user-1");
    expect(payload.role).toBe("driver");
  });

  it("throws a TOKEN_EXPIRED ApiError for an expired token", () => {
    const expired = jwt.sign(
      { sub: "user-1", role: "driver" },
      process.env.ACCESS_TOKEN_SECRET ?? "dev-access-secret-change-me",
      { expiresIn: -10 },
    );

    expect(() => verifyAccessToken(expired)).toThrow(ApiError);
    try {
      verifyAccessToken(expired);
      expect.unreachable("verifyAccessToken should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("TOKEN_EXPIRED");
      expect((err as ApiError).statusCode).toBe(401);
    }
  });

  it("throws an UNAUTHORIZED ApiError for a malformed token", () => {
    try {
      verifyAccessToken("not-a-real-token");
      expect.unreachable("verifyAccessToken should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).code).toBe("UNAUTHORIZED");
      expect((err as ApiError).statusCode).toBe(401);
    }
  });

  it("throws an UNAUTHORIZED ApiError for a token signed with a different secret", () => {
    const foreignToken = jwt.sign({ sub: "user-1", role: "driver" }, "some-other-secret", {
      expiresIn: 900,
    });

    try {
      verifyAccessToken(foreignToken);
      expect.unreachable("verifyAccessToken should have thrown");
    } catch (err) {
      expect((err as ApiError).code).toBe("UNAUTHORIZED");
    }
  });
});

describe("generateRefreshToken / hashRefreshToken", () => {
  it("produces a token whose hash matches hashRefreshToken(token)", () => {
    const { token, tokenHash, expiresAt } = generateRefreshToken();

    expect(token).toMatch(/^[0-9a-f]+$/);
    expect(hashRefreshToken(token)).toBe(tokenHash);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("produces a different token (and hash) on every call", () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();

    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });

  it("hashRefreshToken is deterministic for the same input", () => {
    expect(hashRefreshToken("some-token-value")).toBe(hashRefreshToken("some-token-value"));
  });

  it("hashRefreshToken produces different output for different input", () => {
    expect(hashRefreshToken("token-a")).not.toBe(hashRefreshToken("token-b"));
  });
});
