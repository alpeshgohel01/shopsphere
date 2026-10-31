/**
 * Allow only same-origin relative paths (open-redirect safe).
 * @param {unknown} value
 * @param {string} [fallback="/"]
 * @returns {string}
 */
export function sanitizeCallbackUrl(value, fallback = "/") {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  // Reject absolute URLs, protocol-relative, and backslash tricks
  if (
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("@")
  ) {
    return fallback;
  }

  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;

  // Block encoded tricks that decode to // or scheme
  try {
    const decoded = decodeURIComponent(trimmed);
    if (
      decoded.startsWith("//") ||
      /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded) ||
      decoded.includes("\\")
    ) {
      return fallback;
    }
  } catch {
    return fallback;
  }

  return trimmed;
}
