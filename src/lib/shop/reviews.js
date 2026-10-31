import "server-only";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import {
  getOrdersCol,
  getProductsCol,
  getReviewsCol,
} from "@/lib/shop/collections";
import { HttpError } from "@/lib/shop/api";
import { toObjectId } from "@/lib/shop/products";
import { reviewSchema } from "@/lib/shop/validators";

const iso = (d) => (d instanceof Date ? d.toISOString() : (d ?? null));

function serializeReview(doc, userName) {
  const id = String(doc._id);
  return {
    ...doc,
    _id: id,
    id,
    productId: String(doc.productId),
    userName: userName ?? "Customer",
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

/**
 * Look up display names from the Better Auth "user" collection.
 * @param {string[]} userIds
 * @returns {Promise<Map<string, string>>}
 */
async function getUserNames(userIds) {
  const names = new Map();
  const objectIds = userIds.map(toObjectId).filter(Boolean);
  if (!objectIds.length) return names;
  try {
    const db = await getDb();
    const users = await db
      .collection("user")
      .find({ _id: { $in: objectIds } }, { projection: { name: 1 } })
      .toArray();
    for (const u of users) names.set(String(u._id), u.name);
  } catch {
    // Names are cosmetic; fall back to "Customer".
  }
  return names;
}

/**
 * Which of the given users have a paid order containing the product.
 * @param {string[]} userIds
 * @param {ObjectId} productId
 * @returns {Promise<Set<string>>}
 */
async function getVerifiedBuyers(userIds, productId) {
  if (!userIds.length) return new Set();
  try {
    const orders = await getOrdersCol();
    const rows = await orders
      .find(
        {
          userId: { $in: userIds },
          paymentStatus: "paid",
          status: { $in: ["paid", "shipped", "delivered"] },
          "items.productId": productId,
        },
        { projection: { userId: 1 } },
      )
      .toArray();
    return new Set(rows.map((r) => r.userId));
  } catch {
    return new Set();
  }
}

/**
 * Star distribution for a product: counts per rating 5..1.
 * @param {string | ObjectId} productId
 * @returns {Promise<{ total: number, rows: { stars: number, count: number }[] }>}
 */
export async function getRatingBreakdown(productId) {
  const rows = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }));
  const _id = toObjectId(productId);
  if (!_id) return { total: 0, rows };

  const col = await getReviewsCol();
  const agg = await col
    .aggregate([
      { $match: { productId: _id } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ])
    .toArray();

  let total = 0;
  for (const a of agg) {
    const row = rows.find((r) => r.stars === a._id);
    if (row) {
      row.count = a.count;
      total += a.count;
    }
  }
  return { total, rows };
}

/**
 * @param {string | ObjectId} productId
 * @param {{ page?: number, limit?: number }} [options]
 */
export async function listReviews(productId, { page = 1, limit = 10 } = {}) {
  const _id = toObjectId(productId);
  if (!_id) return { items: [], total: 0, page: 1, limit, totalPages: 1 };

  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const safeLimit = Math.min(50, Math.max(1, Math.floor(Number(limit)) || 10));

  const col = await getReviewsCol();
  const [docs, total] = await Promise.all([
    col
      .find({ productId: _id })
      .sort({ createdAt: -1, _id: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .toArray(),
    col.countDocuments({ productId: _id }),
  ]);

  const userIds = [...new Set(docs.map((d) => d.userId))];
  const [names, verified] = await Promise.all([
    getUserNames(userIds),
    getVerifiedBuyers(userIds, _id),
  ]);
  return {
    items: docs.map((d) => ({
      ...serializeReview(d, names.get(d.userId)),
      verified: verified.has(d.userId),
    })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

/**
 * Whether the user has a paid (or shipped/delivered) order containing the product.
 * @param {string} userId
 * @param {ObjectId} productId
 */
export async function hasPurchasedProduct(userId, productId) {
  const orders = await getOrdersCol();
  const order = await orders.findOne(
    {
      userId,
      paymentStatus: "paid",
      status: { $in: ["paid", "shipped", "delivered"] },
      "items.productId": productId,
    },
    { projection: { _id: 1 } },
  );
  return Boolean(order);
}

/**
 * Recompute and store a product's ratingAvg (1 decimal) and ratingCount.
 * @param {string | ObjectId} productId
 */
export async function recomputeProductRating(productId) {
  const _id = toObjectId(productId);
  if (!_id) throw new HttpError("Invalid product id", 400);

  const reviews = await getReviewsCol();
  const [agg] = await reviews
    .aggregate([
      { $match: { productId: _id } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    .toArray();

  const ratingCount = agg?.count ?? 0;
  const ratingAvg = agg ? Math.round(agg.avg * 10) / 10 : 0;

  const products = await getProductsCol();
  await products.updateOne(
    { _id },
    { $set: { ratingAvg, ratingCount, updatedAt: new Date() } },
  );
  return { ratingAvg, ratingCount };
}

/**
 * Create a review. The user must have a paid/shipped/delivered order that
 * contains the product, and can review each product only once.
 *
 * @param {{ userId: string, productId: string, rating: number, comment: string }} input
 */
export async function createReview({ userId, ...input }) {
  if (!userId) throw new HttpError("Authentication required", 401);
  const data = reviewSchema.parse(input);
  const productId = new ObjectId(data.productId);

  const products = await getProductsCol();
  const product = await products.findOne(
    { _id: productId },
    { projection: { _id: 1 } },
  );
  if (!product) throw new HttpError("Product not found", 404);

  if (!(await hasPurchasedProduct(userId, productId))) {
    throw new HttpError("You can only review products you have purchased", 403);
  }

  const col = await getReviewsCol();
  const now = new Date();
  const doc = {
    productId,
    userId,
    rating: data.rating,
    comment: data.comment,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const res = await col.insertOne(doc);
    await recomputeProductRating(productId);
    const names = await getUserNames([userId]);
    return serializeReview({ ...doc, _id: res.insertedId }, names.get(userId));
  } catch (err) {
    if (err?.code === 11000) {
      throw new HttpError("You have already reviewed this product", 409);
    }
    throw err;
  }
}
