import "server-only";

/**
 * Dev/test hook: last outbound auth emails (never log tokens in production logs
 * beyond this intentional console + in-memory store).
 */

/** @type {{ to: string, subject: string, url?: string, kind: string, at: number }[]} */
const recent = globalThis._authEmailDevStore ?? [];
globalThis._authEmailDevStore = recent;

/**
 * @param {{ to: string, subject: string, url?: string, kind: string }} entry
 */
export function recordDevEmail(entry) {
  recent.unshift({ ...entry, at: Date.now() });
  if (recent.length > 50) recent.length = 50;
}

/**
 * @param {string} [to]
 */
export function getRecentDevEmails(to) {
  if (!to) return [...recent];
  const normalized = to.trim().toLowerCase();
  return recent.filter((e) => e.to === normalized);
}

export function clearDevEmails() {
  recent.length = 0;
}
