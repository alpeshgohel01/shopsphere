import slugifyLib from "slugify";

const MAX_SLUG_LENGTH = 80;

/**
 * Lowercase, URL-safe slug. Never returns an empty string.
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  const slug = slugifyLib(String(text ?? ""), {
    lower: true,
    strict: true,
    trim: true,
  })
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return slug || "item";
}

/**
 * Short random suffix for collision fallback.
 * @param {number} [length]
 */
export function randomSuffix(length = 5) {
  return Math.random()
    .toString(36)
    .slice(2, 2 + length)
    .padEnd(length, "0");
}

/**
 * Generate a slug that is not taken.
 * Tries `base`, `base-2`, `base-3`, ... then falls back to a random suffix.
 *
 * @param {string} text source text (or an already-written slug)
 * @param {(slug: string) => Promise<boolean>} isTaken
 * @returns {Promise<string>}
 */
export async function uniqueSlug(text, isTaken) {
  const base = slugify(text);
  if (!(await isTaken(base))) return base;

  for (let i = 2; i <= 20; i++) {
    const candidate = `${base}-${i}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${base}-${randomSuffix(6)}`;
}
