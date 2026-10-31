/**
 * Feature flags and provider registry.
 * Adding Apple/Discord is a config-only change: set env vars and enable below.
 */

/** @type {boolean} */
export const ENABLE_MAGIC_LINK =
  process.env.ENABLE_MAGIC_LINK === "true" ||
  process.env.NEXT_PUBLIC_ENABLE_MAGIC_LINK === "true";

/**
 * @typedef {{ id: string; name: string; enabled: boolean; envId: string; envSecret: string }} SocialProviderConfig
 */

/** @type {SocialProviderConfig[]} */
export const SOCIAL_PROVIDERS = [
  {
    id: "google",
    name: "Google",
    enabled: true,
    envId: "GOOGLE_CLIENT_ID",
    envSecret: "GOOGLE_CLIENT_SECRET",
  },
  {
    id: "github",
    name: "GitHub",
    enabled: true,
    envId: "GITHUB_CLIENT_ID",
    envSecret: "GITHUB_CLIENT_SECRET",
  },
  // Config-only additions (disabled until credentials exist):
  {
    id: "apple",
    name: "Apple",
    enabled: false,
    envId: "APPLE_CLIENT_ID",
    envSecret: "APPLE_CLIENT_SECRET",
  },
  {
    id: "discord",
    name: "Discord",
    enabled: false,
    envId: "DISCORD_CLIENT_ID",
    envSecret: "DISCORD_CLIENT_SECRET",
  },
];

/**
 * Build Better Auth socialProviders from env + registry.
 * @param {Record<string, string | undefined>} env
 */
export function buildSocialProviders(env) {
  /** @type {Record<string, { clientId: string; clientSecret: string; enabled?: boolean }>} */
  const providers = {};

  for (const provider of SOCIAL_PROVIDERS) {
    if (!provider.enabled) continue;
    const clientId = env[provider.envId];
    const clientSecret = env[provider.envSecret];
    if (clientId && clientSecret) {
      providers[provider.id] = { clientId, clientSecret };
    }
  }

  return providers;
}

/**
 * Client-safe list of enabled social providers (no secrets).
 * @param {Record<string, string | undefined>} [env=process.env]
 */
export function getEnabledSocialProviderIds(env = process.env) {
  return SOCIAL_PROVIDERS.filter((provider) => {
    if (!provider.enabled) return false;
    return Boolean(env[provider.envId] && env[provider.envSecret]);
  }).map((p) => p.id);
}
