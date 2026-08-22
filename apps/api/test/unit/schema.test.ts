import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "../../src/modules/auth/schema.js";

describe("registerSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      email: "driver@swiftcargo.test",
      password: "SafePassage123",
      role: "driver",
    });
    expect(result.success).toBe(true);
  });

  it.each(["not-an-email", "missing-at-sign.com", ""])("rejects an invalid email %j", (email) => {
    const result = registerSchema.safeParse({ email, password: "SafePassage123", role: "driver" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      email: "driver@swiftcargo.test",
      password: "short1",
      role: "driver",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a role outside the known set", () => {
    const result = registerSchema.safeParse({
      email: "driver@swiftcargo.test",
      password: "SafePassage123",
      role: "superuser",
    });
    expect(result.success).toBe(false);
  });

  it.each(["admin", "dispatcher", "driver", "customer"])("accepts role=%s", (role) => {
    const result = registerSchema.safeParse({
      email: "someone@swiftcargo.test",
      password: "SafePassage123",
      role,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing required fields", () => {
    const result = registerSchema.safeParse({ email: "driver@swiftcargo.test" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid login payload", () => {
    const result = loginSchema.safeParse({ email: "driver@swiftcargo.test", password: "anything" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "driver@swiftcargo.test", password: "" });
    expect(result.success).toBe(false);
  });

  it("does not enforce a minimum length on login passwords (unlike registration)", () => {
    const result = loginSchema.safeParse({ email: "driver@swiftcargo.test", password: "a" });
    expect(result.success).toBe(true);
  });
});
