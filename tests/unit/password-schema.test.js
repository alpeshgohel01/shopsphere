import { describe, expect, it } from "vitest";
import { passwordSchema, signUpSchema } from "@/lib/validations/auth";

describe("passwordSchema", () => {
  it("accepts a strong enough password", () => {
    const result = passwordSchema.safeParse("ForestTrail9");
    expect(result.success).toBe(true);
  });

  it("rejects short passwords", () => {
    expect(passwordSchema.safeParse("Ab1").success).toBe(false);
  });

  it("requires a letter and a number", () => {
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });

  it("blocks common passwords", () => {
    expect(passwordSchema.safeParse("password1").success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("normalizes email", () => {
    const result = signUpSchema.safeParse({
      name: "Alex",
      email: "  Alex@Example.COM ",
      password: "ForestTrail9",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("alex@example.com");
    }
  });
});
