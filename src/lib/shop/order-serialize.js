import "server-only";
import { getUserEmailsByIds } from "@/lib/shop/users";

const iso = (d) => (d instanceof Date ? d.toISOString() : (d ?? null));

/**
 * @param {object | null} doc
 */
export function serializeOrder(doc) {
  if (!doc) return null;
  const id = String(doc._id);
  return {
    ...doc,
    _id: id,
    id,
    items: (doc.items ?? []).map((item) => ({
      ...item,
      productId: String(item.productId),
    })),
    paidAt: iso(doc.paidAt),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
    shippedAt: iso(doc.shippedAt),
    deliveredAt: iso(doc.deliveredAt),
    cancelledAt: iso(doc.cancelledAt),
    confirmationEmailSentAt: iso(doc.confirmationEmailSentAt),
  };
}

/**
 * Add `customerEmail` to serialized orders (admin views only). Orders whose
 * user cannot be resolved get `customerEmail: null`.
 * @param {object[]} orders serialized orders
 */
export async function attachCustomerEmails(orders) {
  const emails = await getUserEmailsByIds(orders.map((o) => o.userId));
  return orders.map((o) => ({
    ...o,
    customerEmail: emails.get(String(o.userId)) ?? null,
  }));
}
