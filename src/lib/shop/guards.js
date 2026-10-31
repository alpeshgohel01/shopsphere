import "server-only";
import { getSession, hasRole } from "@/lib/session";
import { HttpError } from "@/lib/shop/api";

/**
 * Route-handler guards. They throw HttpError, which handleRouteError()
 * converts into a 401/403 JSON response.
 */

/**
 * Require a signed-in user (API flavour: 401 instead of a redirect).
 * @returns {Promise<import("@/lib/session").AuthSession>}
 */
export async function requireApiUser() {
  const session = await getSession();
  if (!session) throw new HttpError("Unauthorized", 401);
  return session;
}

/**
 * Require a signed-in admin.
 * @returns {Promise<import("@/lib/session").AuthSession>}
 */
export async function requireApiAdmin() {
  const session = await requireApiUser();
  if (!hasRole(session, "admin")) throw new HttpError("Forbidden", 403);
  return session;
}

/**
 * Session if present, else null (never throws on missing auth).
 */
export async function getOptionalSession() {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

/**
 * Parse a JSON request body, turning malformed input into a 400.
 * @param {Request} request
 */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw new HttpError("Invalid JSON body", 400);
  }
}
