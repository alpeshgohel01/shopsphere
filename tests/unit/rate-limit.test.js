import { describe, expect, it, beforeEach } from "vitest";
import {
  createTestMemoryLimiter,
  setRateLimiterForTests,
  enforceAuthRateLimit,
} from "@/lib/rate-limit";

describe("rate limiter", () => {
  beforeEach(() => {
    setRateLimiterForTests(createTestMemoryLimiter());
  });

  it("allows requests under the limit", async () => {
    const limiter = createTestMemoryLimiter();
    const a = await limiter.limit("t:a", 3, 60_000);
    const b = await limiter.limit("t:a", 3, 60_000);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(b.remaining).toBe(1);
  });

  it("blocks when limit exceeded", async () => {
    const limiter = createTestMemoryLimiter();
    await limiter.limit("t:b", 2, 60_000);
    await limiter.limit("t:b", 2, 60_000);
    const blocked = await limiter.limit("t:b", 2, 60_000);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("enforceAuthRateLimit keys by ip and email", async () => {
    const ok = await enforceAuthRateLimit({
      action: "sign-in",
      ip: "1.1.1.1",
      email: "a@example.com",
      ipLimit: 2,
      emailLimit: 2,
      windowMs: 60_000,
    });
    expect(ok.ok).toBe(true);

    await enforceAuthRateLimit({
      action: "sign-in",
      ip: "1.1.1.1",
      email: "b@example.com",
      ipLimit: 2,
      emailLimit: 2,
      windowMs: 60_000,
    });

    const blocked = await enforceAuthRateLimit({
      action: "sign-in",
      ip: "1.1.1.1",
      email: "c@example.com",
      ipLimit: 2,
      emailLimit: 2,
      windowMs: 60_000,
    });
    expect(blocked.ok).toBe(false);
  });
});
