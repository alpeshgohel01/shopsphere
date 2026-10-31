/**
 * Canonical site URL for auth emails, OAuth callbacks, and redirects.
 *
 * Rules (no more flipping .env between local and live):
 * - On Vercel: never emit localhost. Prefer BETTER_AUTH_URL when it is a
 *   non-local URL, else VERCEL_PROJECT_PRODUCTION_URL / VERCEL_URL.
 * - Locally: use BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL or http://localhost:3000.
 */

/**
 * @param {string | undefined | null} value
 */
export function isLocalhostUrl(value) {
  if (!value) return false;
  try {
    const host = new URL(value).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(value);
  }
}

/**
 * @param {string} value
 */
export function stripTrailingSlash(value) {
  return value.replace(/\/$/, "");
}

/**
 * @returns {string}
 */
export function resolveAppUrl() {
  const explicit =
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const onVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

  if (onVercel) {
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const deploymentHost = process.env.VERCEL_URL;
    const vercelCanonical = productionHost
      ? `https://${productionHost}`
      : deploymentHost
        ? `https://${deploymentHost}`
        : "";

    // Prefer an explicit non-local URL (custom domain / stable production).
    if (explicit && !isLocalhostUrl(explicit)) {
      return stripTrailingSlash(explicit);
    }
    if (vercelCanonical) {
      return stripTrailingSlash(vercelCanonical);
    }
  }

  if (explicit) {
    return stripTrailingSlash(explicit);
  }

  return "http://localhost:3000";
}

/**
 * Origins allowed for CSRF / OAuth (local + production together).
 * @returns {string[]}
 */
export function resolveTrustedOrigins() {
  const origins = new Set();
  const appUrl = resolveAppUrl();
  origins.add(appUrl);

  for (const value of [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]) {
    if (value) origins.add(stripTrailingSlash(value));
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  if (process.env.VERCEL_URL) {
    origins.add(`https://${process.env.VERCEL_URL}`);
  }

  return [...origins];
}

/**
 * Force email / callback links onto the canonical host for this deployment.
 * Prevents localhost links leaking into production emails when env is wrong.
 *
 * @param {string} url
 * @returns {string}
 */
export function rewriteToAppOrigin(url) {
  if (!url) return url;
  const appUrl = resolveAppUrl();
  try {
    const parsed = new URL(url);
    const canonical = new URL(appUrl);
    parsed.protocol = canonical.protocol;
    parsed.hostname = canonical.hostname;
    // Clear non-default ports from the source URL (e.g. :3000 on localhost).
    parsed.port = canonical.port;
    return parsed.toString();
  } catch {
    return url;
  }
}
