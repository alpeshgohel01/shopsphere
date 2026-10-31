import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { sanitizeCallbackUrl } from "@/lib/url/callback-url";

/**
 * Prefixes that require a signed-in user. Everything else (/, /products,
 * /cart, /wishlist, ...) is public.
 */
const PROTECTED_PREFIXES = [
  "/admin",
  "/account",
  "/checkout",
  "/dashboard",
  "/settings",
];

/** @param {string} pathname @param {string} prefix */
const matchesPrefix = (pathname, prefix) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

/**
 * Next.js 16 proxy - optimistic cookie check only for protected routes.
 * Auth pages are NOT bounced here (stale cookies used to trap users).
 * Auth layouts still call redirectIfAuthenticated with a real session check.
 *
 * @param {import("next/server").NextRequest} request
 */
export function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = getSessionCookie(request);

  const isProtected = PROTECTED_PREFIXES.some((p) => matchesPrefix(pathname, p));

  if (isProtected && !sessionCookie) {
    const callbackUrl = sanitizeCallbackUrl(`${pathname}${search}`, "/");
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/account/:path*",
    "/checkout/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
  ],
};
