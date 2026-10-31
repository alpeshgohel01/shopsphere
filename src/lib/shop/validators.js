import { z } from "zod";

/**
 * Zod schemas for ShopSphere. All prices are integer cents.
 * Safe to import from both server and client code.
 */

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
];
export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];
export const PRODUCT_SORTS = [
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "rating",
];

const MAX_CENTS = 100_000_000; // $1,000,000

// ---------- primitives ----------

export const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Invalid id");

const cents = z
  .number({ error: "Price must be a number of cents" })
  .int("Price must be an integer number of cents")
  .min(0)
  .max(MAX_CENTS);

const positiveCents = cents.min(1, "Price must be greater than 0");

const trimmed = (max) => z.string().trim().max(max);

// ---------- products ----------

const imageSchema = z.object({
  url: z.string().trim().url("Invalid image URL").max(2000),
  publicId: z.string().trim().max(300).optional().default(""),
});

const variantSchema = z.object({
  size: z.string().trim().min(1, "Size is required").max(30),
  stock: z.number().int().min(0).max(1_000_000),
});

const variantsArray = z
  .array(variantSchema)
  .min(1, "At least one variant (size) is required")
  .max(40)
  .refine(
    (variants) =>
      new Set(variants.map((v) => v.size.toLowerCase())).size ===
      variants.length,
    "Duplicate sizes are not allowed",
  );

const productBaseSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(160),
  slug: z.string().trim().max(120).optional(),
  description: trimmed(10_000).default(""),
  price: positiveCents,
  compareAtPrice: cents.nullable().optional(),
  category: z.string().trim().min(1, "Category is required").max(80),
  brand: trimmed(80).default(""),
  images: z.array(imageSchema).max(12).default([]),
  variants: variantsArray,
  featured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

const compareAtRefinement = (data, ctx) => {
  if (
    data.compareAtPrice != null &&
    data.price != null &&
    data.compareAtPrice <= data.price
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["compareAtPrice"],
      message: "Compare-at price must be greater than price",
    });
  }
};

export const productCreateSchema = productBaseSchema.superRefine(
  compareAtRefinement,
);

/** Partial update. Defaults are not applied to omitted fields. */
export const productUpdateSchema = z
  .object({
    title: productBaseSchema.shape.title.optional(),
    slug: productBaseSchema.shape.slug,
    description: trimmed(10_000).optional(),
    price: positiveCents.optional(),
    compareAtPrice: cents.nullable().optional(),
    category: productBaseSchema.shape.category.optional(),
    brand: trimmed(80).optional(),
    images: z.array(imageSchema).max(12).optional(),
    variants: variantsArray.optional(),
    featured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine(compareAtRefinement);

// ---------- checkout ----------

export const checkoutAddressSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(100),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .default("")
    .refine((v) => v === "" || v.length >= 5, "Enter a valid phone number or leave it blank"),
  line1: z.string().trim().min(3, "Address is required").max(150),
  line2: trimmed(150).optional().default(""),
  city: z.string().trim().min(1, "City is required").max(80),
  state: z.string().trim().min(1, "State is required").max(80),
  postalCode: z.string().trim().min(2, "Postal code is required").max(20),
  country: z.string().trim().min(2, "Country is required").max(60),
});

/** Saved address in a profile (adds a label and default flag). */
export const profileAddressSchema = checkoutAddressSchema.extend({
  label: z.string().trim().min(1, "Label is required").max(40),
  isDefault: z.boolean().optional().default(false),
});

/** A cart line. The client only sends ids/size/quantity; prices come from the DB. */
export const checkoutItemSchema = z.object({
  productId: objectIdSchema,
  size: z.string().trim().max(30).optional().default(""),
  quantity: z.number().int().min(1).max(20),
});

/**
 * Cart validation request. `price` (cents) is optional and only used to tell
 * the client whether its cached price is stale; it is never trusted.
 */
export const cartValidateItemSchema = z.object({
  productId: objectIdSchema,
  size: z.string().trim().max(30).optional().default(""),
  quantity: z.number().int().min(1).max(999),
  price: z.number().int().min(0).max(MAX_CENTS).optional(),
});

export const cartValidateSchema = z.object({
  items: z.array(cartValidateItemSchema).max(50),
});

export const checkoutItemsSchema = z
  .array(checkoutItemSchema)
  .min(1, "Your cart is empty")
  .max(50);

export const checkoutSchema = z.object({
  items: checkoutItemsSchema,
  shippingAddress: checkoutAddressSchema,
});

// ---------- reviews ----------

export const reviewSchema = z.object({
  productId: objectIdSchema,
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Please write a short comment").max(2000),
});

// ---------- queries ----------

const emptyToUndefined = (v) => (v === "" || v === null ? undefined : v);

const optionalString = (max) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());

const optionalInt = (min, max) =>
  z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(min).max(max).optional(),
  );

const optionalBool = z.preprocess((v) => {
  if (v === true || v === "true" || v === "1") return true;
  if (v === false || v === "false" || v === "0") return false;
  return undefined;
}, z.boolean().optional());

/** Prices here are cents. */
export const productListQuerySchema = z
  .object({
    q: optionalString(100),
    category: optionalString(80),
    minPrice: optionalInt(0, MAX_CENTS),
    maxPrice: optionalInt(0, MAX_CENTS),
    sort: z.preprocess(
      (v) => (PRODUCT_SORTS.includes(v) ? v : undefined),
      z.enum(PRODUCT_SORTS).default("newest"),
    ),
    page: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
    ),
    limit: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(100).catch(12).default(12),
    ),
    featured: optionalBool,
    sale: optionalBool,
    rating: z.preprocess((v) => {
      if (v === "" || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isFinite(n) && n >= 1 && n <= 5 ? n : undefined;
    }, z.number().optional()),
  })
  .refine(
    (d) => d.minPrice == null || d.maxPrice == null || d.minPrice <= d.maxPrice,
    { path: ["minPrice"], message: "minPrice must be <= maxPrice" },
  );

// ---------- orders ----------

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingNumber: optionalString(100),
  carrier: optionalString(60),
});

export const newsletterSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .email("Enter a valid email"),
});

/** Label of a saved address to remove. */
export const addressDeleteSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(40),
});

export const orderListQuerySchema = z.object({
  status: z.preprocess(
    (v) => (ORDER_STATUSES.includes(v) ? v : undefined),
    z.enum(ORDER_STATUSES).optional(),
  ),
  q: optionalString(100),
  page: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(10_000).catch(1).default(1),
  ),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).max(100).catch(20).default(20),
  ),
});
