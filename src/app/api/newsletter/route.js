import { headers } from "next/headers";
import { HttpError, handleRouteError, jsonOk } from "@/lib/shop/api";
import { readJson } from "@/lib/shop/guards";
import { subscribeToNewsletter } from "@/lib/shop/newsletter";
import { enforceAuthRateLimit } from "@/lib/rate-limit";

/** POST /api/newsletter - public. Body: { email } */
export async function POST(request) {
  try {
    const body = (await readJson(request)) ?? {};

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
    const limited = await enforceAuthRateLimit({
      action: "newsletter",
      ip,
      ipLimit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (!limited.ok) throw new HttpError(limited.error, 429);

    const { alreadySubscribed } = await subscribeToNewsletter(body);
    return jsonOk({ subscribed: true, alreadySubscribed }, alreadySubscribed ? 200 : 201);
  } catch (err) {
    return handleRouteError(err);
  }
}
