import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { enforceAuthRateLimit } from "@/lib/rate-limit";
import { normalizeEmail } from "@/lib/email/normalize";
import { logger } from "@/lib/logger";

const { GET: authGET, POST: authPOST } = toNextJsHandler(auth);

/**
 * @param {Request} request
 */
function getClientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

/**
 * Map auth paths to rate-limit buckets.
 * @param {string} pathname
 */
function rateLimitAction(pathname) {
  if (pathname.includes("/sign-in/email")) return "sign-in";
  if (pathname.includes("/sign-up/email")) return "sign-up";
  if (
    pathname.includes("/forget-password") ||
    pathname.includes("/request-password-reset")
  ) {
    return "forgot-password";
  }
  if (pathname.includes("/reset-password")) return "reset-password";
  if (pathname.includes("/send-verification-email")) return "resend-verification";
  if (pathname.includes("/sign-in/magic-link")) return "magic-link";
  return null;
}

/**
 * @param {Request} request
 */
async function withRateLimit(request, handler) {
  const url = new URL(request.url);
  const action = rateLimitAction(url.pathname);

  if (action && request.method === "POST") {
    let email = null;
    try {
      const clone = request.clone();
      const body = await clone.json();
      if (body?.email) email = normalizeEmail(body.email);
    } catch {
      // non-JSON body - still limit by IP
    }

    const limited = await enforceAuthRateLimit({
      action,
      ip: getClientIp(request),
      email,
      ipLimit: action === "sign-in" ? 20 : 10,
      emailLimit: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!limited.ok) {
      logger.warn("Auth rate limit hit", { action });
      return Response.json(
        { message: limited.error },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.max(1, Math.ceil((limited.resetAt - Date.now()) / 1000)),
            ),
          },
        },
      );
    }
  }

  return handler(request);
}

export async function GET(request) {
  return withRateLimit(request, authGET);
}

export async function POST(request) {
  return withRateLimit(request, authPOST);
}
