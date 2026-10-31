import "server-only";
import { getProductsCol, getProfilesCol } from "@/lib/shop/collections";
import { HttpError } from "@/lib/shop/api";
import { serializeProduct, toObjectId } from "@/lib/shop/products";
import {
  addressDeleteSchema,
  objectIdSchema,
  profileAddressSchema,
} from "@/lib/shop/validators";

const MAX_ADDRESSES = 10;
const MAX_WISHLIST = 200;

const iso = (d) => (d instanceof Date ? d.toISOString() : (d ?? null));

function serializeProfile(userId, doc) {
  return {
    userId,
    wishlist: (doc?.wishlist ?? []).map(String),
    addresses: doc?.addresses ?? [],
    createdAt: iso(doc?.createdAt),
    updatedAt: iso(doc?.updatedAt),
  };
}

/**
 * Get a user's shop profile. Returns an empty profile if none exists yet
 * (nothing is written).
 * @param {string} userId
 */
export async function getProfile(userId) {
  const col = await getProfilesCol();
  const doc = await col.findOne({ userId });
  return serializeProfile(userId, doc);
}

/**
 * Add or replace a saved address (matched by label, case-insensitive).
 * The first address is always the default; setting isDefault clears the others.
 *
 * @param {string} userId
 * @param {unknown} address
 */
export async function upsertAddress(userId, address) {
  if (!userId) throw new HttpError("Authentication required", 401);
  const data = profileAddressSchema.parse(address);

  const col = await getProfilesCol();
  const existing = await col.findOne({ userId });
  const addresses = [...(existing?.addresses ?? [])];

  const idx = addresses.findIndex(
    (a) => a.label.toLowerCase() === data.label.toLowerCase(),
  );
  if (idx === -1 && addresses.length >= MAX_ADDRESSES) {
    throw new HttpError(`You can save up to ${MAX_ADDRESSES} addresses`, 400);
  }

  const isDefault =
    data.isDefault || addresses.length === 0 || (idx !== -1 && addresses.length === 1);
  const entry = { ...data, isDefault };

  if (idx === -1) addresses.push(entry);
  else addresses[idx] = entry;

  const next = addresses.map((a) =>
    a === entry
      ? a
      : { ...a, isDefault: isDefault ? false : Boolean(a.isDefault) },
  );
  // Guarantee exactly one default.
  if (!next.some((a) => a.isDefault)) next[0].isDefault = true;

  const now = new Date();
  await col.updateOne(
    { userId },
    {
      $set: { addresses: next, updatedAt: now },
      $setOnInsert: { wishlist: [], createdAt: now },
    },
    { upsert: true },
  );
  return next;
}

/**
 * Remove a saved address by label (case-insensitive). If the default address
 * is removed, the first remaining address becomes the default.
 *
 * @param {string} userId
 * @param {unknown} input { label }
 * @returns {Promise<object[]>} remaining addresses
 */
export async function deleteAddress(userId, input) {
  if (!userId) throw new HttpError("Authentication required", 401);
  const { label } = addressDeleteSchema.parse(input);

  const col = await getProfilesCol();
  const existing = await col.findOne({ userId });
  const addresses = existing?.addresses ?? [];

  const next = addresses.filter((a) => a.label.toLowerCase() !== label.toLowerCase());
  if (next.length === addresses.length) throw new HttpError("Address not found", 404);

  if (next.length && !next.some((a) => a.isDefault)) {
    next[0] = { ...next[0], isDefault: true };
  }

  await col.updateOne({ userId }, { $set: { addresses: next, updatedAt: new Date() } });
  return next;
}

/**
 * Toggle a product in the user's wishlist.
 * @param {string} userId
 * @param {string} productId
 * @returns {Promise<{ added: boolean, wishlist: string[] }>}
 */
export async function toggleWishlist(userId, productId) {
  if (!userId) throw new HttpError("Authentication required", 401);
  const id = objectIdSchema.parse(productId);

  const col = await getProfilesCol();
  const existing = await col.findOne({ userId }, { projection: { wishlist: 1 } });
  const has = (existing?.wishlist ?? []).map(String).includes(id);
  const now = new Date();

  if (has) {
    const doc = await col.findOneAndUpdate(
      { userId },
      { $pull: { wishlist: id }, $set: { updatedAt: now } },
      { returnDocument: "after" },
    );
    return { added: false, wishlist: (doc?.wishlist ?? []).map(String) };
  }

  const products = await getProductsCol();
  const product = await products.findOne(
    { _id: toObjectId(id), isActive: true },
    { projection: { _id: 1 } },
  );
  if (!product) throw new HttpError("Product not found", 404);

  if ((existing?.wishlist?.length ?? 0) >= MAX_WISHLIST) {
    throw new HttpError("Wishlist is full", 400);
  }

  const doc = await col.findOneAndUpdate(
    { userId },
    {
      $addToSet: { wishlist: id },
      $set: { updatedAt: now },
      $setOnInsert: { addresses: [], createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  return { added: true, wishlist: (doc?.wishlist ?? []).map(String) };
}

/** Alias for toggleWishlist. */
export const setWishlist = toggleWishlist;

/**
 * Active products in the user's wishlist (most recently added first).
 * @param {string} userId
 */
export async function getWishlistProducts(userId) {
  const profile = await getProfile(userId);
  const ids = profile.wishlist.map(toObjectId).filter(Boolean);
  if (!ids.length) return [];

  const products = await getProductsCol();
  const docs = await products
    .find({ _id: { $in: ids }, isActive: true })
    .toArray();
  const byId = new Map(docs.map((d) => [String(d._id), d]));

  return [...profile.wishlist]
    .reverse()
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map(serializeProduct);
}
