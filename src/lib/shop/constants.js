/**
 * Shop-wide constants. Amounts are integer cents.
 * Safe to import from both server and client code.
 */

export const STORE_NAME = "ShopSphere";

/** Orders with a subtotal over this amount ship free ($100.00). */
export const FREE_SHIPPING_THRESHOLD = 10000;

/** Flat shipping fee ($7.99). */
export const SHIPPING_FEE = 799;

/** Sales tax rate (8%). */
export const TAX_RATE = 0.08;

const unsplash = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

/**
 * Product categories, used for home page tiles and filters.
 * `name` matches the `category` field stored on products.
 */
export const CATEGORIES = [
  {
    slug: "sneakers",
    name: "Sneakers",
    label: "Sneakers",
    description: "Fresh kicks for every step",
    image: unsplash("1542291026-7eec264c27ff"),
  },
  {
    slug: "apparel",
    name: "Apparel",
    label: "Apparel",
    description: "Streetwear built to layer",
    image: unsplash("1556821840-3a63f95609a7"),
  },
  {
    slug: "accessories",
    name: "Accessories",
    label: "Accessories",
    description: "Finish the fit",
    image: unsplash("1553062407-98eeb64c6a62"),
  },
  {
    slug: "essentials",
    name: "Essentials",
    label: "Essentials",
    description: "Everyday basics and care",
    image: unsplash("1586350977771-b3b0abd50c82"),
  },
];

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);
