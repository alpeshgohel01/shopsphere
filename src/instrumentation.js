/**
 * Next.js instrumentation - validate env as soon as the server starts.
 */
export async function register() {
  await import("@/env");
}
