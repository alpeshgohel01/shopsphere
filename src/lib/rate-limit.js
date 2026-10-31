import "server-only";
import { getDb } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * @typedef {object} RateLimitResult
 * @property {boolean} success
 * @property {number} remaining
 * @property {number} resetAt
 */

/**
 * @typedef {object} RateLimiter
 * @property {(key: string, limit: number, windowMs: number) => Promise<RateLimitResult>} limit
 */

/** In-memory store (dev / fallback). Survives hot reload via global. */
const memoryStore = globalThis._rateLimitMemory ?? new Map();
globalThis._rateLimitMemory = memoryStore;

/**
 * @returns {RateLimiter}
 */
function createMemoryLimiter() {
  return {
    async limit(key, limit, windowMs) {
      const now = Date.now();
      const entry = memoryStore.get(key);

      if (!entry || entry.resetAt <= now) {
        const resetAt = now + windowMs;
        memoryStore.set(key, { count: 1, resetAt });
        return { success: true, remaining: limit - 1, resetAt };
      }

      if (entry.count >= limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count += 1;
      memoryStore.set(key, entry);
      return {
        success: true,
        remaining: Math.max(0, limit - entry.count),
        resetAt: entry.resetAt,
      };
    },
  };
}

/**
 * MongoDB-backed fixed-window limiter. Swap for Upstash by implementing RateLimiter.
 * @returns {RateLimiter}
 */
function createMongoLimiter() {
  return {
    async limit(key, limit, windowMs) {
      try {
        const db = await getDb();
        const col = db.collection("rate_limits");
        const now = Date.now();
        const windowStart = now - windowMs;

        const doc = await col.findOne({ key });

        if (!doc || doc.windowStart < windowStart) {
          const resetAt = now + windowMs;
          await col.updateOne(
            { key },
            {
              $set: {
                key,
                count: 1,
                windowStart: now,
                resetAt: new Date(resetAt),
                updatedAt: new Date(),
              },
            },
            { upsert: true },
          );
          return { success: true, remaining: limit - 1, resetAt };
        }

        if (doc.count >= limit) {
          return {
            success: false,
            remaining: 0,
            resetAt: new Date(doc.resetAt).getTime(),
          };
        }

        const updated = await col.findOneAndUpdate(
          { key, count: { $lt: limit } },
          {
            $inc: { count: 1 },
            $set: { updatedAt: new Date() },
          },
          { returnDocument: "after" },
        );

        if (!updated) {
          return {
            success: false,
            remaining: 0,
            resetAt: new Date(doc.resetAt).getTime(),
          };
        }

        return {
          success: true,
          remaining: Math.max(0, limit - updated.count),
          resetAt: new Date(updated.resetAt ?? doc.resetAt).getTime(),
        };
      } catch (error) {
        logger.warn("Mongo rate limiter failed; falling back to memory", {
          error: error instanceof Error ? error.message : "unknown",
        });
        return createMemoryLimiter().limit(key, limit, windowMs);
      }
    },
  };
}

/** @type {RateLimiter | null} */
let limiterInstance = null;

/**
 * @returns {RateLimiter}
 */
export function getRateLimiter() {
  if (limiterInstance) return limiterInstance;
  const backend = process.env.RATE_LIMIT_BACKEND ?? "mongodb";
  limiterInstance =
    backend === "memory" ? createMemoryLimiter() : createMongoLimiter();
  return limiterInstance;
}

/** Exposed for tests - inject a custom limiter. */
export function setRateLimiterForTests(limiter) {
  limiterInstance = limiter;
}

/**
 * Rate-limit auth actions by IP and email.
 * @param {{ action: string, ip?: string | null, email?: string | null, ipLimit?: number, emailLimit?: number, windowMs?: number }} opts
 * @returns {Promise<{ ok: true } | { ok: false, error: string, resetAt: number }>}
 */
export async function enforceAuthRateLimit(opts) {
  const {
    action,
    ip,
    email,
    ipLimit = 10,
    emailLimit = 5,
    windowMs = 15 * 60 * 1000,
  } = opts;

  const limiter = getRateLimiter();

  if (ip) {
    const ipResult = await limiter.limit(`auth:${action}:ip:${ip}`, ipLimit, windowMs);
    if (!ipResult.success) {
      return {
        ok: false,
        error: "Too many requests. Please try again later.",
        resetAt: ipResult.resetAt,
      };
    }
  }

  if (email) {
    const emailResult = await limiter.limit(
      `auth:${action}:email:${email}`,
      emailLimit,
      windowMs,
    );
    if (!emailResult.success) {
      return {
        ok: false,
        error: "Too many requests for this email. Please try again later.",
        resetAt: emailResult.resetAt,
      };
    }
  }

  return { ok: true };
}

/**
 * Pure in-memory limiter used by unit tests (no DB).
 * @returns {RateLimiter}
 */
export function createTestMemoryLimiter() {
  return createMemoryLimiter();
}
