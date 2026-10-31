import "server-only";
import { getDb } from "@/lib/db";

/** @type {Promise<void> | null} */
let indexesPromise = null;

async function createIndexes() {
  const db = await getDb();
  await Promise.all([
    db.collection("products").createIndexes([
      { key: { slug: 1 }, name: "product_slug_unique", unique: true },
      { key: { isActive: 1, category: 1, createdAt: -1 }, name: "product_browse" },
      { key: { isActive: 1, featured: 1 }, name: "product_featured" },
      { key: { isActive: 1, price: 1 }, name: "product_price" },
    ]),
    db.collection("orders").createIndexes([
      { key: { orderNumber: 1 }, name: "order_number_unique", unique: true },
      { key: { userId: 1, createdAt: -1 }, name: "order_user" },
      { key: { stripeSessionId: 1 }, name: "order_stripe_session", sparse: true },
      { key: { status: 1, createdAt: -1 }, name: "order_status" },
    ]),
    db.collection("reviews").createIndexes([
      {
        key: { productId: 1, userId: 1 },
        name: "review_product_user_unique",
        unique: true,
      },
      { key: { productId: 1, createdAt: -1 }, name: "review_product" },
    ]),
    db.collection("shopProfiles").createIndexes([
      { key: { userId: 1 }, name: "profile_user_unique", unique: true },
    ]),
    db.collection("subscribers").createIndexes([
      { key: { email: 1 }, name: "subscriber_email_unique", unique: true },
    ]),
  ]);
}

/**
 * Ensure shop indexes exist (once per process). Failures are retried on next call.
 */
export function ensureShopIndexes() {
  if (!indexesPromise) {
    indexesPromise = createIndexes().catch((err) => {
      indexesPromise = null;
      console.error("[shop] failed to ensure indexes", err);
    });
  }
  return indexesPromise;
}

/**
 * @param {string} name
 */
async function getCol(name) {
  const db = await getDb();
  await ensureShopIndexes();
  return db.collection(name);
}

export const getProductsCol = () => getCol("products");
export const getOrdersCol = () => getCol("orders");
export const getReviewsCol = () => getCol("reviews");
export const getProfilesCol = () => getCol("shopProfiles");
export const getSubscribersCol = () => getCol("subscribers");
/** Internal counters (used for order numbers). */
export const getCountersCol = () => getCol("shopCounters");
