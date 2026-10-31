/**
 * Money helpers. All amounts in the shop are integer cents.
 * Safe to import from both server and client code.
 */

export const CURRENCY = "USD";
export const FREE_SHIPPING_THRESHOLD_CENTS = 10000; // $100.00
export const FLAT_SHIPPING_CENTS = 799; // $7.99
export const TAX_RATE = 0.08;

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
});

/**
 * @param {unknown} cents
 * @returns {number} an integer number of cents (non-finite input becomes 0)
 */
export function toCents(cents) {
  const n = Number(cents);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Format integer cents as a localized currency string, e.g. 1999 -> "$19.99".
 * @param {number | null | undefined} cents
 * @returns {string}
 */
export function formatCents(cents) {
  return formatter.format(toCents(cents) / 100);
}

/**
 * Convert a dollar amount (e.g. from a form input) to integer cents.
 * @param {number | string} dollars
 * @returns {number}
 */
export function dollarsToCents(dollars) {
  const n = Number(dollars);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/**
 * Compute order totals from a subtotal in cents.
 * - Shipping is free when subtotal is over $100.00 (strictly greater than 10000 cents),
 *   otherwise 799 cents. An empty cart (0 subtotal) has no shipping.
 * - Tax is 8% of the subtotal, rounded to the nearest cent.
 *
 * @param {number} subtotalCents
 * @returns {{ subtotal: number, shippingFee: number, tax: number, total: number }}
 */
export function computeOrderTotals(subtotalCents) {
  const subtotal = Math.max(0, toCents(subtotalCents));
  const shippingFee =
    subtotal === 0 || subtotal > FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : FLAT_SHIPPING_CENTS;
  const tax = Math.round(subtotal * TAX_RATE);
  return {
    subtotal,
    shippingFee,
    tax,
    total: subtotal + shippingFee + tax,
  };
}
