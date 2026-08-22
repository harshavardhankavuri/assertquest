import { describe, expect, it } from "vitest";
import { ApiError } from "../../src/core/errors.js";

describe("ApiError factories", () => {
  it("unauthorized() defaults to 401 UNAUTHORIZED", () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Authentication required");
  });

  it("unauthorized() accepts a custom message", () => {
    const err = ApiError.unauthorized("Missing bearer token");
    expect(err.message).toBe("Missing bearer token");
    expect(err.code).toBe("UNAUTHORIZED");
  });

  it("tokenExpired() maps to 401 TOKEN_EXPIRED", () => {
    const err = ApiError.tokenExpired();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("TOKEN_EXPIRED");
  });

  it("forbidden() maps to 403 FORBIDDEN", () => {
    const err = ApiError.forbidden();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });

  it("validation() maps to 400 VALIDATION_ERROR and carries details", () => {
    const details = { fieldErrors: { email: ["Invalid email"] } };
    const err = ApiError.validation("Invalid payload", details);
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.details).toBe(details);
  });

  it("conflict() maps to 409 CONFLICT", () => {
    const err = ApiError.conflict("Email already registered");
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });

  it("notFound() defaults to 404 NOT_FOUND", () => {
    const err = ApiError.notFound();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("is a genuine Error instance usable with instanceof", () => {
    const err = ApiError.forbidden();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });
});
