import "server-only";
import { ObjectId } from "mongodb";
import { getProductsCol } from "@/lib/shop/collections";
import { HttpError } from "@/lib/shop/api";
import { uniqueSlug, slugify } from "@/lib/shop/slug";
import {
  productCreateSchema,
  productListQuerySchema,
  productUpdateSchema,
} from "@/lib/shop/validators";

/**
 * @param {unknown} id
 * @returns {ObjectId | null}
 */
export function toObjectId(id) {
  if (id instanceof ObjectId) return id;
  if (typeof id === "string" && /^[a-fA-F0-9]{24}$/.test(id)) {
    return new ObjectId(id);
  }
  return null;
}

/**
 * @param {string} str
 */
export function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const iso = (d) => (d instanceof Date ? d.toISOString() : (d ?? null));

/**
 * Convert a product document to a plain, serializable object
 * (safe to pass from Server to Client Components).
 * @param {object | null} doc
 */
export function serializeProduct(doc) {
  if (!doc) return null;
  const id = String(doc._id);
  return {
    ...doc,
    _id: id,
    id,
    images: doc.images ?? [],
    variants: doc.variants ?? [],
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

/** Total stock across all variants. */
export function totalStock(product) {
  return (product?.variants ?? []).reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
  rating: { ratingAvg: -1, ratingCount: -1, _id: 1 },
};

/**
 * List products with filtering, sorting and pagination.
 * Public callers only see active products.
 *
 * @param {object} [query] raw query (e.g. Object.fromEntries(searchParams))
 * @param {{ includeInactive?: boolean }} [options]
 */
export async function listProducts(query = {}, options = {}) {
  const parsed = productListQuerySchema.safeParse(query);
  const q = parsed.success
    ? parsed.data
    : productListQuerySchema.parse({ page: query.page, limit: query.limit });

  /** @type {Record<string, any>} */
  const filter = {};
  if (!options.includeInactive) filter.isActive = true;

  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [
      { title: rx },
      { brand: rx },
      { category: rx },
      { description: rx },
    ];
  }
  if (q.category) {
    filter.category = new RegExp(`^${escapeRegex(q.category)}$`, "i");
  }
  if (q.minPrice != null || q.maxPrice != null) {
    filter.price = {};
    if (q.minPrice != null) filter.price.$gte = q.minPrice;
    if (q.maxPrice != null) filter.price.$lte = q.maxPrice;
  }
  if (q.featured != null) filter.featured = q.featured;
  // On sale: compareAtPrice is set and higher than price (null never matches).
  if (q.sale) {
    filter.compareAtPrice = { $ne: null };
    filter.$expr = { $gt: ["$compareAtPrice", "$price"] };
  }
  if (q.rating != null) filter.ratingAvg = { $gte: q.rating };

  const col = await getProductsCol();
  const [docs, total] = await Promise.all([
    col
      .find(filter)
      .sort(SORTS[q.sort])
      .skip((q.page - 1) * q.limit)
      .limit(q.limit)
      .toArray(),
    col.countDocuments(filter),
  ]);

  return {
    items: docs.map(serializeProduct),
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.max(1, Math.ceil(total / q.limit)),
  };
}

/**
 * @param {string} slug
 * @param {{ includeInactive?: boolean }} [options]
 */
export async function getProductBySlug(slug, options = {}) {
  if (typeof slug !== "string" || !slug) return null;
  const col = await getProductsCol();
  const filter = { slug: slug.toLowerCase() };
  if (!options.includeInactive) filter.isActive = true;
  return serializeProduct(await col.findOne(filter));
}

/**
 * @param {string | ObjectId} id
 * @param {{ includeInactive?: boolean }} [options]
 */
export async function getProductById(id, options = {}) {
  const _id = toObjectId(id);
  if (!_id) return null;
  const col = await getProductsCol();
  const filter = { _id };
  if (!options.includeInactive) filter.isActive = true;
  return serializeProduct(await col.findOne(filter));
}

/**
 * @param {unknown} input validated with productCreateSchema
 */
export async function createProduct(input) {
  const data = productCreateSchema.parse(input);
  const col = await getProductsCol();

  const slug = await uniqueSlug(data.slug || data.title, async (s) =>
    Boolean(await col.findOne({ slug: s }, { projection: { _id: 1 } })),
  );

  const now = new Date();
  const doc = {
    title: data.title,
    slug,
    description: data.description,
    price: data.price,
    compareAtPrice: data.compareAtPrice ?? null,
    category: data.category,
    brand: data.brand,
    images: data.images,
    variants: data.variants,
    featured: data.featured,
    ratingAvg: 0,
    ratingCount: 0,
    isActive: data.isActive,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const res = await col.insertOne(doc);
    return serializeProduct({ ...doc, _id: res.insertedId });
  } catch (err) {
    if (err?.code === 11000) {
      throw new HttpError("A product with this slug already exists", 409);
    }
    throw err;
  }
}

/**
 * @param {string | ObjectId} id
 * @param {unknown} input validated with productUpdateSchema (partial)
 */
export async function updateProduct(id, input) {
  const _id = toObjectId(id);
  if (!_id) throw new HttpError("Invalid product id", 400);

  const data = productUpdateSchema.parse(input);
  const col = await getProductsCol();

  const existing = await col.findOne({ _id });
  if (!existing) throw new HttpError("Product not found", 404);

  // Cross-field check against the stored values.
  const price = data.price ?? existing.price;
  const compareAt =
    data.compareAtPrice !== undefined
      ? data.compareAtPrice
      : existing.compareAtPrice;
  if (compareAt != null && compareAt <= price) {
    throw new HttpError("Compare-at price must be greater than price", 400);
  }

  /** @type {Record<string, any>} */
  const set = {};
  for (const key of [
    "title",
    "description",
    "price",
    "category",
    "brand",
    "images",
    "variants",
    "featured",
    "isActive",
  ]) {
    if (data[key] !== undefined) set[key] = data[key];
  }
  if (data.compareAtPrice !== undefined) set.compareAtPrice = data.compareAtPrice;

  if (data.slug !== undefined && data.slug !== "") {
    const wanted = slugify(data.slug);
    if (wanted !== existing.slug) {
      const taken = await col.findOne(
        { slug: wanted, _id: { $ne: _id } },
        { projection: { _id: 1 } },
      );
      if (taken) throw new HttpError("Slug is already in use", 409);
      set.slug = wanted;
    }
  }

  set.updatedAt = new Date();

  try {
    const updated = await col.findOneAndUpdate(
      { _id },
      { $set: set },
      { returnDocument: "after" },
    );
    return serializeProduct(updated);
  } catch (err) {
    if (err?.code === 11000) {
      throw new HttpError("Slug is already in use", 409);
    }
    throw err;
  }
}

/**
 * Delete a product. Soft-deletes (isActive=false) by default so that past
 * orders and reviews keep working; pass { hard: true } to remove the document.
 *
 * @param {string | ObjectId} id
 * @param {{ hard?: boolean }} [options]
 * @returns {Promise<boolean>} whether a product was found
 */
export async function deleteProduct(id, { hard = false } = {}) {
  const _id = toObjectId(id);
  if (!_id) return false;
  const col = await getProductsCol();
  if (hard) {
    const res = await col.deleteOne({ _id });
    return res.deletedCount > 0;
  }
  const res = await col.updateOne(
    { _id },
    { $set: { isActive: false, featured: false, updatedAt: new Date() } },
  );
  return res.matchedCount > 0;
}

/**
 * Products in the same category, topped up with other active products.
 * @param {string | ObjectId | { _id: any, category?: string }} productOrId
 * @param {number} [limit]
 */
export async function getRelatedProducts(productOrId, limit = 4) {
  const col = await getProductsCol();

  let product = productOrId;
  if (typeof productOrId === "string" || productOrId instanceof ObjectId) {
    const _id = toObjectId(productOrId);
    product = _id ? await col.findOne({ _id }) : null;
  }
  if (!product) return [];

  const _id = toObjectId(String(product._id));
  const related = await col
    .find({ isActive: true, category: product.category, _id: { $ne: _id } })
    .sort({ ratingAvg: -1, createdAt: -1 })
    .limit(limit)
    .toArray();

  if (related.length < limit) {
    const exclude = [_id, ...related.map((p) => p._id)];
    const extra = await col
      .find({ isActive: true, _id: { $nin: exclude } })
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit - related.length)
      .toArray();
    related.push(...extra);
  }
  return related.map(serializeProduct);
}

/**
 * @returns {Promise<{ category: string, count: number }[]>}
 */
export async function getCategoriesWithCounts() {
  const col = await getProductsCol();
  const rows = await col
    .aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();
  return rows.map((r) => ({ category: r._id, count: r.count }));
}

/**
 * Most recently added active products.
 * @param {number} [limit]
 */
export async function getNewArrivals(limit = 8) {
  const col = await getProductsCol();
  const docs = await col
    .find({ isActive: true })
    .sort(SORTS.newest)
    .limit(limit)
    .toArray();
  return docs.map(serializeProduct);
}

/**
 * Best-rated active products (needs at least one review), then newest.
 * @param {number} [limit]
 */
export async function getTopRatedProducts(limit = 4) {
  const col = await getProductsCol();
  const docs = await col
    .find({ isActive: true, ratingCount: { $gt: 0 } })
    .sort({ ratingAvg: -1, ratingCount: -1, createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(serializeProduct);
}

/**
 * @param {number} [limit]
 */
export async function getFeaturedProducts(limit = 8) {
  const col = await getProductsCol();
  const docs = await col
    .find({ isActive: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return docs.map(serializeProduct);
}
