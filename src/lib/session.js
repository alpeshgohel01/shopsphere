import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { sanitizeCallbackUrl } from "@/lib/url/callback-url";

/**
 * @typedef {{ user: { id: string, email: string, name: string, image?: string | null, emailVerified: boolean, role?: string }, session: object }} AuthSession
 */

/**
 * Re-verify session from the database (never trust proxy alone).
 * @returns {Promise<AuthSession | null>}
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Require an authenticated session or redirect to sign-in.
 * @param {string} [callbackPath]
 * @returns {Promise<AuthSession>}
 */
export async function requireSession(callbackPath = "/") {
  const session = await getSession();
  if (!session) {
    const safe = sanitizeCallbackUrl(callbackPath, "/");
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(safe)}`);
  }
  return session;
}

/**
 * Redirect authenticated users away from auth pages.
 * @param {string} [to="/"]
 */
export async function redirectIfAuthenticated(to = "/") {
  const session = await getSession();
  if (session) {
    redirect(sanitizeCallbackUrl(to, "/"));
  }
}

/**
 * Server-side role check.
 * Unauthenticated users go to sign-in (returning to `callbackPath`);
 * signed-in users without the role are sent to the storefront home.
 * @param {"user"|"admin"|("user"|"admin")[]} roles
 * @param {string} [callbackPath] where to return after signing in
 * @returns {Promise<AuthSession>}
 */
export async function requireRole(roles, callbackPath = "/") {
  const session = await requireSession(callbackPath);
  const allowed = Array.isArray(roles) ? roles : [roles];
  const role = session.user.role || "user";
  if (!allowed.includes(role)) {
    redirect("/");
  }
  return session;
}

/**
 * @param {AuthSession | null | undefined} session
 * @param {"user"|"admin"|("user"|"admin")[]} roles
 */
export function hasRole(session, roles) {
  if (!session?.user) return false;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(session.user.role || "user");
}
