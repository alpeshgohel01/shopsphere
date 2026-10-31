import "server-only";
import { getDb } from "@/lib/db";
import { escapeRegex, toObjectId } from "@/lib/shop/products";

const iso = (d) => (d instanceof Date ? d.toISOString() : (d ?? null));

/**
 * Read-only list of Better Auth users (Mongo `user` collection) for the admin
 * panel. The caller must enforce admin authorization.
 *
 * @param {{ q?: string, page?: number, limit?: number }} [query]
 */
export async function listUsersAdmin({ q, page = 1, limit = 25 } = {}) {
  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const safeLimit = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 25));

  const filter = {};
  const term = typeof q === "string" ? q.trim().slice(0, 100) : "";
  if (term) {
    const rx = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ name: rx }, { email: rx }];
  }

  const db = await getDb();
  const col = db.collection("user");
  const [docs, total] = await Promise.all([
    col
      .find(filter, {
        projection: { name: 1, email: 1, role: 1, emailVerified: 1, image: 1, createdAt: 1 },
      })
      .sort({ createdAt: -1, _id: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .toArray(),
    col.countDocuments(filter),
  ]);

  return {
    items: docs.map((u) => ({
      id: String(u._id),
      name: u.name ?? "",
      email: u.email ?? "",
      role: u.role || "user",
      emailVerified: Boolean(u.emailVerified),
      image: u.image ?? null,
      createdAt: iso(u.createdAt),
    })),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

/**
 * Emails for a set of Better Auth user ids (admin views). Never throws:
 * returns an empty map if the lookup fails.
 * @param {string[]} userIds
 * @returns {Promise<Map<string, string>>} userId -> email
 */
export async function getUserEmailsByIds(userIds) {
  const ids = [...new Set((userIds ?? []).filter(Boolean).map(String))];
  const out = new Map();
  if (!ids.length) return out;
  try {
    const db = await getDb();
    const objectIds = ids.map(toObjectId).filter(Boolean);
    const docs = await db
      .collection("user")
      .find(
        { $or: [{ _id: { $in: objectIds } }, { id: { $in: ids } }] },
        { projection: { email: 1, id: 1 } },
      )
      .toArray();
    for (const d of docs) {
      if (!d.email) continue;
      out.set(String(d._id), d.email);
      if (d.id) out.set(String(d.id), d.email);
    }
  } catch (err) {
    console.error("[users] email lookup failed", err);
  }
  return out;
}

/**
 * Ids of users whose email contains the search term (admin order search).
 * @param {string} term
 * @returns {Promise<string[]>}
 */
export async function findUserIdsByEmail(term) {
  const text = typeof term === "string" ? term.trim().slice(0, 100) : "";
  if (!text) return [];
  try {
    const db = await getDb();
    const docs = await db
      .collection("user")
      .find({ email: new RegExp(escapeRegex(text), "i") }, { projection: { _id: 1 } })
      .limit(50)
      .toArray();
    return docs.map((d) => String(d._id));
  } catch (err) {
    console.error("[users] email search failed", err);
    return [];
  }
}

/**
 * Name and email for one Better Auth user (used for transactional email).
 * @param {string} userId
 * @returns {Promise<{ name: string, email: string } | null>}
 */
export async function getUserContact(userId) {
  if (!userId) return null;
  const db = await getDb();
  const col = db.collection("user");
  const _id = toObjectId(userId);
  const doc = await col.findOne(
    { $or: [...(_id ? [{ _id }] : []), { id: String(userId) }] },
    { projection: { name: 1, email: 1 } },
  );
  if (!doc?.email) return null;
  return { name: doc.name ?? "", email: doc.email };
}