import { describe, expect, it } from "vitest";
import { sanitizeCallbackUrl } from "@/lib/url/callback-url";

describe("sanitizeCallbackUrl", () => {
  it("allows relative paths", () => {
    expect(sanitizeCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(sanitizeCallbackUrl("/settings?tab=security")).toBe(
      "/settings?tab=security",
    );
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(sanitizeCallbackUrl("https://evil.com")).toBe("/");
    expect(sanitizeCallbackUrl("//evil.com")).toBe("/");
    expect(sanitizeCallbackUrl("http://localhost:3000/dashboard")).toBe("/");
  });

  it("rejects backslash and encoded tricks", () => {
    expect(sanitizeCallbackUrl("/\\evil.com")).toBe("/");
    expect(sanitizeCallbackUrl("/%2f%2fevil.com")).toBe("/");
  });

  it("falls back to / for empty or non-string input", () => {
    expect(sanitizeCallbackUrl("")).toBe("/");
    expect(sanitizeCallbackUrl(undefined)).toBe("/");
  });

  it("uses custom fallback", () => {
    expect(sanitizeCallbackUrl("https://x.com", "/home")).toBe("/home");
  });
});
