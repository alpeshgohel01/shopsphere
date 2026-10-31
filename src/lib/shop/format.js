import { format, isValid, parseISO } from "date-fns";
import { formatCents } from "@/lib/shop/money";

/**
 * Format integer cents as a price string.
 * @param {number | null | undefined} cents
 * @returns {string}
 */
export function formatPrice(cents) {
  return formatCents(cents);
}

/**
 * @param {Date | string | number | null | undefined} value
 * @returns {Date | null}
 */
function toDate(value) {
  if (value == null || value === "") return null;
  const date =
    typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
}

/**
 * Format a date with date-fns. Returns "" for missing/invalid input.
 * @param {Date | string | number | null | undefined} value
 * @param {string} [pattern]
 * @returns {string}
 */
export function formatDate(value, pattern = "MMM d, yyyy") {
  const date = toDate(value);
  return date ? format(date, pattern) : "";
}

/**
 * @param {Date | string | number | null | undefined} value
 * @returns {string}
 */
export function formatDateTime(value) {
  return formatDate(value, "MMM d, yyyy 'at' h:mm a");
}
