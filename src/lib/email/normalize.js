/**
 * Trim and lowercase an email address.
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}
