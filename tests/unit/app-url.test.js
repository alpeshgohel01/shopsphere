import { afterEach, describe, expect, it } from "vitest";
import {
  isLocalhostUrl,
  resolveAppUrl,
  rewriteToAppOrigin,
  stripTrailingSlash,
} from "@/lib/app-url";

const KEYS = [
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
];

const snapshot = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of KEYS) {
    if (snapshot[key] === undefined) delete process.env[key];
    else process.env[key] = snapshot[key];
  }
});

describe("app-url", () => {
  it("detects localhost hosts", () => {
    expect(isLocalhostUrl("http://localhost:3000")).toBe(true);
    expect(isLocalhostUrl("https://auth-system-jet-one.vercel.app")).toBe(false);
  });

  it("uses explicit local URL off Vercel", () => {
    delete process.env.VERCEL;
    delete process.env.VERCEL_ENV;
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    expect(resolveAppUrl()).toBe("http://localhost:3000");
  });

  it("rejects localhost on Vercel and uses production host", () => {
    process.env.VERCEL = "1";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "auth-system-jet-one.vercel.app";
    expect(resolveAppUrl()).toBe("https://auth-system-jet-one.vercel.app");
  });

  it("rewrites email links onto the canonical host", () => {
    process.env.VERCEL = "1";
    process.env.BETTER_AUTH_URL = "https://auth-system-jet-one.vercel.app";
    const rewritten = rewriteToAppOrigin(
      "http://localhost:3000/api/auth/verify-email?token=abc",
    );
    expect(rewritten).toBe(
      "https://auth-system-jet-one.vercel.app/api/auth/verify-email?token=abc",
    );
    expect(stripTrailingSlash("https://x.com/")).toBe("https://x.com");
  });
});
