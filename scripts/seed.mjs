/**
 * Idempotent seed for ShopSphere (modern sneakers & streetwear).
 *
 * Usage: npm run db:seed
 *   (node --env-file=.env scripts/seed.mjs)
 *
 * - Products are upserted by slug.
 * - Users are upserted by email; the credential account password is re-hashed
 *   on every run so the documented logins always work.
 * - Orders are upserted by orderNumber (SS-9xxxxx, outside the app's counter range).
 * - Reviews for the seed users are replaced; product ratings are recomputed.
 *
 * Amounts are integer cents.
 */
import { MongoClient, ObjectId } from "mongodb";
import { hashPassword } from "better-auth/crypto";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

if (!process.env.MONGODB_URI && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch {
    // no .env file; rely on the real environment
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is required (set it in .env or the environment).");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !process.argv.includes("--force")) {
  console.error("Refusing to seed with NODE_ENV=production (pass --force to override).");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FREE_SHIPPING_THRESHOLD = 10000;
const SHIPPING_FEE = 799;
const TAX_RATE = 0.08;

/** Deterministic PRNG so repeated runs produce the same data. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20261031);
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const photo = (id) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;
const images = (...ids) => ids.map((id) => ({ url: photo(id), publicId: "" }));

const SNEAKER_SIZES = ["7", "8", "9", "10", "11", "12"];
const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];
const ONE_SIZE = ["One Size"];
const SOCK_SIZES = ["S/M", "L/XL"];

/** Build variants with deterministic-random stock (a few low / sold-out sizes). */
function variants(sizes) {
  return sizes.map((size) => {
    const roll = rand();
    const stock = roll < 0.08 ? 0 : roll < 0.25 ? randInt(1, 4) : randInt(8, 45);
    return { size, stock };
  });
}

const daysAgo = (days, hourOffset = 0) =>
  new Date(Date.now() - days * 86_400_000 - hourOffset * 3_600_000);

// ---------------------------------------------------------------------------
// Catalog (24 products)
// ---------------------------------------------------------------------------

/** @type {Array<Record<string, any>>} */
const CATALOG = [
  // ---- Sneakers (8) ----
  {
    slug: "aero-runner-one",
    title: "Aero Runner One",
    brand: "Sphere Athletics",
    category: "Sneakers",
    price: 12900,
    compareAtPrice: 15900,
    featured: true,
    description:
      "A featherweight everyday runner with a breathable engineered mesh upper and a responsive foam midsole. Built for city miles and all-day comfort.",
    images: images("1542291026-7eec264c27ff", "1549298916-b41d501d3772", "1491553895911-0055eca6402d"),
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "midnight-high-top",
    title: "Midnight High Top",
    brand: "Sphere Athletics",
    category: "Sneakers",
    price: 14900,
    featured: true,
    description:
      "Premium black-on-black high top with padded ankle support, waxed laces and a cushioned insole. A court classic reworked for the street.",
    images: images("1460353581641-37baddab0fa2", "1595950653106-6c9ebd614d3a", "1606107557195-0e29a4b5b4aa", "1600185365926-3a2ce3cdb9eb"),
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "cloud-court-low",
    title: "Cloud Court Low",
    brand: "Northside",
    category: "Sneakers",
    price: 11900,
    description:
      "Clean white leather low-top with a stitched cupsole and a soft suede heel tab. Goes with literally everything in your closet.",
    images: images("1608231387042-66d1773070a5", "1514989940723-e8e51635b782"),
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "volt-trail-trainer",
    title: "Volt Trail Trainer",
    brand: "Northside",
    category: "Sneakers",
    price: 16900,
    compareAtPrice: 19900,
    featured: true,
    description:
      "Aggressive lugged outsole meets all-weather ripstop upper. Take the streets and the trails in the same pair.",
    images: images("1552346154-21d32810aba3", "1587563871167-1ee9c731aefb", "1543508282-6319a3e2621f"),
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "retro-88-classic",
    title: "Retro 88 Classic",
    brand: "Sphere Athletics",
    category: "Sneakers",
    price: 10900,
    compareAtPrice: 12900,
    description:
      "Throwback runner silhouette with suede overlays and a gum sole. Inspired by late-80s track heritage.",
    images: images("1525966222134-fcfa99b8ae77", "1551107696-a4b0c5a0d9a2"),
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "pulse-knit-racer",
    title: "Pulse Knit Racer",
    brand: "Kinetic",
    category: "Sneakers",
    price: 13900,
    featured: true,
    description:
      "One-piece knit upper that fits like a sock, paired with a bouncy dual-density sole. Lightweight, flexible, effortless.",
    images: images("1579338559194-a162d19bf842", "1539185441755-769473a23570", "1556906781-9a412961c28c"),
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "apex-chunky-platform",
    title: "Apex Chunky Platform",
    brand: "Kinetic",
    category: "Sneakers",
    price: 18900,
    description:
      "Statement platform sneaker with a sculpted chunky sole and layered leather panels. Adds instant height and attitude.",
    images: images("1597045566677-8cf032ed6634", "1560769629-975ec94e6a86"),
    sizes: SNEAKER_SIZES,
  },
  {
    slug: "stealth-leather-lux",
    title: "Stealth Leather Lux",
    brand: "Sphere Athletics",
    category: "Sneakers",
    price: 24900,
    featured: true,
    description:
      "Our flagship: full-grain Italian leather, hand-finished edges and a Margom outsole. Quiet luxury for your rotation.",
    images: images("1549298916-b41d501d3772", "1600185365926-3a2ce3cdb9eb", "1606107557195-0e29a4b5b4aa"),
    sizes: SNEAKER_SIZES,
  },

  // ---- Apparel (7) ----
  {
    slug: "everyday-heavyweight-tee",
    title: "Everyday Heavyweight Tee",
    brand: "ShopSphere",
    category: "Apparel",
    price: 2900,
    compareAtPrice: 3900,
    description:
      "260gsm combed cotton, boxy cut, ribbed collar. The one white tee you will actually keep for years.",
    images: images("1521572163474-6864f9cf17ab", "1583743814966-8936f5b7be1a"),
    sizes: APPAREL_SIZES,
  },
  {
    slug: "oversized-fleece-hoodie",
    title: "Oversized Fleece Hoodie",
    brand: "ShopSphere",
    category: "Apparel",
    price: 7900,
    featured: true,
    description:
      "Brushed-back organic cotton fleece with a drop shoulder and double-lined hood. Soft, heavy and ridiculously cozy.",
    images: images("1556821840-3a63f95609a7", "1618354691373-d851c5c3a990", "1576566588028-4147f3842f27"),
    sizes: APPAREL_SIZES,
  },
  {
    slug: "boxy-graphic-tee",
    title: "Boxy Graphic Tee",
    brand: "Street Theory",
    category: "Apparel",
    price: 3400,
    description:
      "Washed jersey tee with a vintage-style chest print and a relaxed, cropped-boxy fit.",
    images: images("1503341504253-dff4815485f1", "1523381210434-271e8be1f52b"),
    sizes: APPAREL_SIZES,
  },
  {
    slug: "utility-cargo-pants",
    title: "Utility Cargo Pants",
    brand: "Street Theory",
    category: "Apparel",
    price: 8900,
    compareAtPrice: 10900,
    description:
      "Relaxed-taper cargo pants in durable cotton twill with six pockets and adjustable ankle toggles.",
    images: images("1624378439575-d8705ad7ae80", "1434389677669-e08b4cac3105", "1489987707025-afc232f7ea0f"),
    sizes: APPAREL_SIZES,
  },
  {
    slug: "coach-jacket",
    title: "Coach Jacket",
    brand: "Northside",
    category: "Apparel",
    price: 12900,
    featured: true,
    description:
      "Lightweight water-resistant snap-front coach jacket with a mesh lining and embroidered back hit.",
    images: images("1591047139829-d91aecb6caea", "1551028719-00167b16eac5", "1620799140408-edc6dcb6d633"),
    sizes: APPAREL_SIZES,
  },
  {
    slug: "relaxed-denim-jeans",
    title: "Relaxed Denim Jeans",
    brand: "Street Theory",
    category: "Apparel",
    price: 9900,
    description:
      "Mid-rise, relaxed-leg jeans in rigid 12oz denim that breaks in beautifully. Finished with a clean raw hem.",
    images: images("1542272604-787c3835535d", "1529374255404-311a2a4f1fd9"),
    sizes: APPAREL_SIZES,
  },
  {
    slug: "retro-track-jacket",
    title: "Retro Track Jacket",
    brand: "Sphere Athletics",
    category: "Apparel",
    price: 8400,
    compareAtPrice: 10400,
    description:
      "Full-zip tricot track jacket with contrast side stripes and a stand collar. Old-school sport energy.",
    images: images("1578587018452-892bacefd3f2", "1618354691373-d851c5c3a990"),
    sizes: APPAREL_SIZES,
  },

  // ---- Accessories (5) ----
  {
    slug: "daily-canvas-backpack",
    title: "Daily Canvas Backpack",
    brand: "Northside",
    category: "Accessories",
    price: 6900,
    featured: true,
    description:
      "Waxed canvas 22L backpack with a padded 15-inch laptop sleeve, magnetic buckle and reflective trim.",
    images: images("1553062407-98eeb64c6a62", "1584917865442-de89df76afd3", "1590874103328-eac38a683ce7"),
    sizes: ONE_SIZE,
  },
  {
    slug: "washed-dad-cap",
    title: "Washed Dad Cap",
    brand: "ShopSphere",
    category: "Accessories",
    price: 2400,
    description:
      "Pre-washed cotton six-panel cap with an embroidered logo and an adjustable brass buckle.",
    images: images("1588850561407-ed78c282e89b", "1491336477066-31156b5e4f35"),
    sizes: ONE_SIZE,
  },
  {
    slug: "ribbed-knit-beanie",
    title: "Ribbed Knit Beanie",
    brand: "ShopSphere",
    category: "Accessories",
    price: 1900,
    description:
      "Soft merino-blend rib knit beanie with a double-fold cuff. One size fits most.",
    images: images("1575428652377-a2d80e2277fc", "1511499767150-a48a237f0083"),
    sizes: ONE_SIZE,
  },
  {
    slug: "minimal-crossbody-bag",
    title: "Minimal Crossbody Bag",
    brand: "Kinetic",
    category: "Accessories",
    price: 4900,
    compareAtPrice: 5900,
    description:
      "Compact water-repellent crossbody with an adjustable strap and two zip compartments. Fits phone, wallet and keys.",
    images: images("1590874103328-eac38a683ce7", "1584917865442-de89df76afd3"),
    sizes: ONE_SIZE,
  },
  {
    slug: "field-analog-watch",
    title: "Field Analog Watch",
    brand: "Kinetic",
    category: "Accessories",
    price: 8900,
    description:
      "Brushed steel case, sapphire-coated glass and an interchangeable nylon strap. A clean everyday timepiece.",
    images: images("1523275335684-37898b6baf30", "1572635196237-14b3f281503f", "1627123424574-724758594e93"),
    sizes: ONE_SIZE,
  },

  // ---- Essentials (4) ----
  {
    slug: "crew-sock-3-pack",
    title: "Crew Sock 3-Pack",
    brand: "ShopSphere",
    category: "Essentials",
    price: 1900,
    description:
      "Cushioned combed-cotton crew socks with arch support and a reinforced heel and toe. Pack of three.",
    images: images("1586350977771-b3b0abd50c82", "1582966772680-860e372bb558"),
    sizes: SOCK_SIZES,
  },
  {
    slug: "sneaker-care-kit",
    title: "Sneaker Care Kit",
    brand: "Sphere Care",
    category: "Essentials",
    price: 2400,
    description:
      "Everything to keep your pairs fresh: gentle foam cleaner, soft-bristle brush, microfibre towel and protector spray.",
    images: images("1631160299919-6a175aa6d189", "1556905055-8f358a7a47b2"),
    sizes: ONE_SIZE,
  },
  {
    slug: "everyday-tote-bag",
    title: "Everyday Tote Bag",
    brand: "ShopSphere",
    category: "Essentials",
    price: 2900,
    description:
      "Heavy cotton canvas tote with an inner zip pocket and reinforced handles. Carries groceries, gym kit or a laptop.",
    images: images("1618354691551-44de113f0164", "1620799139834-6b8f844fbe61"),
    sizes: ONE_SIZE,
  },
  {
    slug: "essential-boxer-briefs-3-pack",
    title: "Essential Boxer Briefs 3-Pack",
    brand: "ShopSphere",
    category: "Essentials",
    price: 3200,
    description:
      "Stretch-cotton boxer briefs with a soft no-roll waistband and tagless comfort. Pack of three.",
    images: images("1560343090-f0409e92791a", "1521572267360-ee0c2909d518", "1562157873-818bc0726f68"),
    sizes: APPAREL_SIZES,
  },
];

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const SEED_USERS = [
  { name: "ShopSphere Admin", email: "admin@shopsphere.app", password: "Admin@12345", role: "admin" },
  { name: "Demo Shopper", email: "demo@shopsphere.app", password: "Demo@12345", role: "user" },
];

/** Passwordless reviewers so review author names render nicely. */
const REVIEWERS = [
  "Maya Chen",
  "Jordan Ellis",
  "Priya Nair",
  "Marcus Webb",
  "Sofia Alvarez",
  "Liam O'Connor",
  "Aisha Rahman",
  "Noah Fischer",
  "Zoe Laurent",
  "Kenji Watanabe",
  "Camila Torres",
  "Ethan Brooks",
].map((name, i) => ({
  name,
  email: `reviewer${i + 1}@seed.shopsphere.app`,
}));

// ---------------------------------------------------------------------------
// Orders / reviews data
// ---------------------------------------------------------------------------

const ORDER_PLAN = [
  // [status, ageInDays]
  ["delivered", 29],
  ["delivered", 26],
  ["delivered", 23],
  ["delivered", 19],
  ["delivered", 16],
  ["cancelled", 14],
  ["delivered", 12],
  ["shipped", 9],
  ["shipped", 7],
  ["shipped", 5],
  ["paid", 4],
  ["paid", 3],
  ["paid", 2],
  ["pending", 1],
  ["pending", 0.2],
];

const ADDRESSES = [
  { fullName: "Demo Shopper", phone: "+1 415 555 0134", line1: "221 Market Street", line2: "Apt 4B", city: "San Francisco", state: "CA", postalCode: "94105", country: "United States" },
  { fullName: "Demo Shopper", phone: "+1 212 555 0198", line1: "48 Bleecker Street", line2: "", city: "New York", state: "NY", postalCode: "10012", country: "United States" },
  { fullName: "ShopSphere Admin", phone: "+1 310 555 0172", line1: "900 Abbot Kinney Blvd", line2: "", city: "Los Angeles", state: "CA", postalCode: "90291", country: "United States" },
];

const REVIEW_COMMENTS = {
  5: [
    "Absolutely love these. Fit true to size and the quality is outstanding.",
    "Better than expected. Wore them all weekend and got compliments everywhere.",
    "Premium feel for the price. Already thinking about getting a second one.",
    "Perfect everyday piece. Shipping was quick and packaging was great.",
    "Comfortable from the first wear. Highly recommend.",
  ],
  4: [
    "Really solid quality. Runs just slightly large, so consider sizing down.",
    "Great looking and well made. Took off one star because delivery was a day late.",
    "Very happy with this. Colour is a touch different from the photos but still great.",
    "Good value and comfortable. Would buy again.",
  ],
  3: [
    "Decent overall. Looks good but the fit is a little tighter than I expected.",
    "It is fine for the price. Nothing special but does the job.",
  ],
  2: ["Not quite what I hoped for. The material feels thinner than the photos suggest."],
};
const RATING_BAG = [5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 3, 3, 2];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const client = new MongoClient(uri);

async function ensureIndexes(db) {
  // Keep names/specs identical to scripts/ensure-indexes.mjs and
  // src/lib/shop/collections.js so nothing conflicts.
  await Promise.all([
    db.collection("user").createIndex({ email: 1 }, { unique: true, name: "user_email_unique" }),
    db.collection("account").createIndex({ userId: 1 }, { name: "account_userId" }),
    db.collection("account").createIndex(
      { providerId: 1, accountId: 1 },
      { unique: true, name: "account_provider_account_unique" },
    ),
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
      { key: { productId: 1, userId: 1 }, name: "review_product_user_unique", unique: true },
      { key: { productId: 1, createdAt: -1 }, name: "review_product" },
    ]),
    db.collection("shopProfiles").createIndexes([
      { key: { userId: 1 }, name: "profile_user_unique", unique: true },
    ]),
  ]);
}

/**
 * Upsert a Better Auth user (matched by lowercased email).
 * Returns the user's ObjectId.
 */
async function upsertUser(db, { name, email, role, password }) {
  const users = db.collection("user");
  const accounts = db.collection("account");
  const now = new Date();
  const normalized = email.toLowerCase();

  const res = await users.findOneAndUpdate(
    { email: normalized },
    {
      $set: { name, emailVerified: true, role, updatedAt: now },
      $setOnInsert: { email: normalized, image: null, createdAt: now },
    },
    { upsert: true, returnDocument: "after" },
  );
  const userId = res._id;

  if (password) {
    const hash = await hashPassword(password);
    await accounts.updateOne(
      { providerId: "credential", userId },
      {
        $set: { password: hash, accountId: String(userId), updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );
  }
  return userId;
}

function computeTotals(subtotal) {
  const shippingFee = subtotal === 0 || subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, shippingFee, tax, total: subtotal + shippingFee + tax };
}

async function main() {
  await client.connect();
  const db = client.db();
  console.log(`Seeding database "${db.databaseName}"`);

  await ensureIndexes(db);
  console.log("" indexes ensured");

  // ---- Users ----
  const userIds = {};
  for (const u of SEED_USERS) {
    userIds[u.email] = await upsertUser(db, u);
  }
  const reviewerIds = [];
  for (const r of REVIEWERS) {
    reviewerIds.push(await upsertUser(db, { ...r, role: "user" }));
  }
  const adminId = userIds["admin@shopsphere.app"];
  const demoId = userIds["demo@shopsphere.app"];
  console.log(`" users: ${SEED_USERS.length} accounts + ${REVIEWERS.length} reviewers`);

  // ---- Products ----
  const products = db.collection("products");
  const now = new Date();
  for (const [index, p] of CATALOG.entries()) {
    const createdAt = daysAgo(60 - index * 2);
    await products.updateOne(
      { slug: p.slug },
      {
        $set: {
          title: p.title,
          description: p.description,
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          category: p.category,
          brand: p.brand,
          images: p.images,
          variants: variants(p.sizes),
          featured: Boolean(p.featured),
          isActive: true,
          updatedAt: now,
        },
        $setOnInsert: { slug: p.slug, ratingAvg: 0, ratingCount: 0, createdAt },
      },
      { upsert: true },
    );
  }
  const seeded = await products.find({ slug: { $in: CATALOG.map((p) => p.slug) } }).toArray();
  const bySlug = new Map(seeded.map((p) => [p.slug, p]));
  console.log(`" products: ${seeded.length} (${seeded.filter((p) => p.featured).length} featured)`);

  // ---- Orders ----
  const orders = db.collection("orders");
  const orderOwners = [
    demoId, demoId, demoId, demoId, demoId, demoId, demoId, demoId, demoId, demoId,
    adminId, adminId, reviewerIds[0], reviewerIds[1], demoId,
  ];
  /** product ids purchased (paid/shipped/delivered) per user, for review eligibility */
  const purchased = new Map();

  for (const [i, [status, ageDays]] of ORDER_PLAN.entries()) {
    const userId = orderOwners[i];
    const userIdStr = String(userId);
    const lineCount = randInt(1, 3);
    const chosen = shuffle(seeded).slice(0, lineCount);

    const items = chosen.map((product) => {
      const inStock = product.variants.filter((v) => v.stock > 0);
      const variant = pick(inStock.length ? inStock : product.variants);
      return {
        productId: product._id,
        title: product.title,
        image: product.images?.[0]?.url ?? "",
        price: product.price,
        quantity: randInt(1, 2),
        size: variant.size,
      };
    });

    const totals = computeTotals(items.reduce((s, it) => s + it.price * it.quantity, 0));
    const createdAt = daysAgo(ageDays, randInt(0, 6));
    const isPaid = ["paid", "shipped", "delivered"].includes(status);
    const paidAt = isPaid ? new Date(createdAt.getTime() + 5 * 60_000) : null;
    const orderNumber = `SS-${900001 + i}`;
    const address =
      userId === adminId ? ADDRESSES[2] : i % 2 === 0 ? ADDRESSES[0] : ADDRESSES[1];

    const doc = {
      orderNumber,
      userId: userIdStr,
      items,
      shippingAddress:
        userId === demoId || userId === adminId
          ? address
          : { ...ADDRESSES[1], fullName: i === 12 ? REVIEWERS[0].name : REVIEWERS[1].name },
      ...totals,
      status,
      paymentStatus: isPaid ? "paid" : "unpaid",
      stripeSessionId: null,
      stripePaymentIntentId: isPaid ? `pi_seed_${900001 + i}` : null,
      paidAt,
      stockDecremented: isPaid,
      createdAt,
      updatedAt: new Date(createdAt.getTime() + 10 * 60_000),
    };
    if (status === "shipped" || status === "delivered") {
      doc.shippedAt = new Date(createdAt.getTime() + 24 * 3_600_000);
      doc.updatedAt = doc.shippedAt;
    }
    if (status === "delivered") {
      doc.deliveredAt = new Date(createdAt.getTime() + 4 * 86_400_000);
      doc.updatedAt = doc.deliveredAt;
    }
    if (status === "cancelled") {
      doc.cancelledAt = new Date(createdAt.getTime() + 2 * 3_600_000);
      doc.updatedAt = doc.cancelledAt;
    }

    await orders.replaceOne({ orderNumber }, doc, { upsert: true });

    if (isPaid) {
      const set = purchased.get(userIdStr) ?? new Set();
      for (const it of items) set.add(String(it.productId));
      purchased.set(userIdStr, set);
    }
  }
  console.log(`" orders: ${ORDER_PLAN.length}`);

  // ---- Reviews (~40) ----
  const reviews = db.collection("reviews");
  const seedUserIdStrs = [adminId, demoId, ...reviewerIds].map(String);
  await reviews.deleteMany({
    userId: { $in: seedUserIdStrs },
    productId: { $in: seeded.map((p) => p._id) },
  });

  const used = new Set();
  const reviewDocs = [];
  const addReview = (userId, productId) => {
    const key = `${userId}:${productId}`;
    if (used.has(key)) return false;
    used.add(key);
    const rating = pick(RATING_BAG);
    const createdAt = daysAgo(randInt(0, 25), randInt(0, 20));
    reviewDocs.push({
      productId,
      userId: String(userId),
      rating,
      comment: pick(REVIEW_COMMENTS[rating]),
      createdAt,
      updatedAt: createdAt,
    });
    return true;
  };

  // Genuine purchasers first (demo + admin, only products they bought).
  for (const uid of [demoId, adminId]) {
    for (const pid of purchased.get(String(uid)) ?? []) {
      if (reviewDocs.length < 8) addReview(uid, new ObjectId(pid));
    }
  }
  // Fill the rest with reviewers.
  const TARGET = 40;
  let guard = 0;
  while (reviewDocs.length < TARGET && guard++ < 2000) {
    addReview(pick(reviewerIds), pick(seeded)._id);
  }
  if (reviewDocs.length) await reviews.insertMany(reviewDocs);

  // Recompute rating aggregates for every seeded product.
  const aggs = await reviews
    .aggregate([
      { $match: { productId: { $in: seeded.map((p) => p._id) } } },
      { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ])
    .toArray();
  const aggById = new Map(aggs.map((a) => [String(a._id), a]));
  await products.bulkWrite(
    seeded.map((p) => {
      const a = aggById.get(String(p._id));
      return {
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              ratingAvg: a ? Math.round(a.avg * 10) / 10 : 0,
              ratingCount: a?.count ?? 0,
            },
          },
        },
      };
    }),
  );
  console.log(`" reviews: ${reviewDocs.length}`);

  // ---- Demo shop profile (address + wishlist) ----
  const wishlist = shuffle(seeded).slice(0, 4).map((p) => String(p._id));
  const profiles = db.collection("shopProfiles");
  await profiles.updateOne(
    { userId: String(demoId) },
    {
      $set: {
        wishlist,
        addresses: [{ ...ADDRESSES[0], label: "Home", isDefault: true }],
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  console.log("" demo profile (address + wishlist)");

  console.log("\nDone. Logins:");
  console.log("  admin@shopsphere.app / Admin@12345  (admin)");
  console.log("  demo@shopsphere.app  / Demo@12345   (user)");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
