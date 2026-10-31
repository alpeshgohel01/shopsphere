/**
 * Central brand copy for ShopSphere. Short, dry, specific.
 * ASCII only. Safe for server and client.
 */

export const ANNOUNCEMENT = [
  "Free shipping over $100",
  "30-day returns",
  "Member early access",
];

export const HERO = {
  eyebrow: "Season 04",
  brand: "ShopSphere",
  headline: "Built for the street. Cut for the long day.",
  line: "Limited runs in sneakers, outerwear and daily uniform. Ships in 24h.",
  primaryCta: { href: "/products", label: "Shop Season 04" },
  secondaryCta: { href: "/products?sort=newest", label: "New arrivals" },
};

export const SECTIONS = {
  featured: { eyebrow: "Featured", title: "Current favourites", cta: "View all" },
  newArrivals: { eyebrow: "Just in", title: "New arrivals", cta: "Shop new" },
  categories: { eyebrow: "Departments", title: "Shop by category" },
  topRated: { eyebrow: "Best rated", title: "Trending now", cta: "Top rated" },
};

export const EDITORIAL = {
  eyebrow: "Seasonal edit",
  headline: "Last season. Still sharp. Now marked down.",
  text: "Pieces from earlier runs, priced to move. When the size is gone, it is gone.",
  cta: { href: "/products?sale=1", label: "Shop the sale" },
  image:
    "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1800&q=80",
};

export const BENEFITS = [
  { key: "shipping", title: "Free shipping", text: "Over $100. Ships within 24h." },
  { key: "returns", title: "30-day returns", text: "Unworn, tags on. No forms." },
  { key: "secure", title: "Secure checkout", text: "Card payments handled by Stripe." },
  { key: "access", title: "Member early access", text: "Drops land in your inbox first." },
];

export const NEWSLETTER = {
  title: "First look at every drop.",
  text: "One email a week. New releases, early access, nothing else.",
  success: "You are on the list.",
};

export const FOOTER = {
  tagline: "Sneakers and streetwear, chosen with intent. Free shipping over $100.",
  legal: "All rights reserved.",
  sign: "ShopSphere",
  help: [
    { href: "/shipping", label: "Shipping" },
    { href: "/returns", label: "Returns" },
    { href: "/size-guide", label: "Size Guide" },
    { href: "/contact", label: "Contact" },
  ],
};

export const EMPTY = {
  noProducts: {
    title: "Nothing matches",
    description: "No pieces fit those filters. Clear them or start from a department.",
  },
  homeNoProducts: "New pieces landing soon.",
  reviews: "No reviews yet. Buyers can leave the first one.",
  wishlist: "Nothing saved yet.",
  cart: "Your bag is empty.",
};

export const PRODUCT = {
  inStock: "In stock - ships within 24h",
  lowStock: (n) => `Low stock - only ${n} left`,
  soldOut: "Sold out",
  accordion: {
    details: "Details & materials",
    shipping: "Shipping & returns",
    care: "Care",
  },
  shippingText: [
    "Free standard shipping on orders over $100. Otherwise a flat $7.99.",
    "Orders ship within 24 hours on business days.",
    "Returns accepted within 30 days. Unworn, tags attached.",
  ],
  careText: [
    "Spot clean with a damp cloth and mild soap.",
    "Air dry away from direct heat.",
    "Garments: wash cold, inside out, hang dry. Footwear: remove laces before cleaning.",
  ],
  fallbackDetails: [
    "Limited run. Check size before you buy.",
    "True to size unless noted. See the size guide.",
  ],
};

export const ORDER_STEPS = {
  placed: "Placed",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const POLICY_PAGES = {
  shipping: {
    title: "Shipping",
    intro: "Fast, tracked, no surprises at the door.",
    sections: [
      {
        heading: "Rates",
        body: "Orders over $100 ship free. Anything under is a flat $7.99.",
      },
      {
        heading: "Handling",
        body: "Orders placed on business days ship within 24 hours. Weekend orders ship Monday.",
      },
      {
        heading: "Delivery",
        body: "Standard delivery takes 3 to 7 business days. A tracking link follows once your order ships.",
      },
      {
        heading: "Address changes",
        body: "Need to fix an address? Write to us within one hour of ordering and we will try to catch it.",
      },
    ],
  },
  returns: {
    title: "Returns",
    intro: "30 days. Unworn. Tags on.",
    sections: [
      {
        heading: "Window",
        body: "You have 30 days from delivery to start a return.",
      },
      {
        heading: "Condition",
        body: "Items must be unworn, unwashed and in the original packaging with tags attached.",
      },
      {
        heading: "Refunds",
        body: "Refunds go back to the original payment method within 5 to 10 business days of us receiving the parcel.",
      },
      {
        heading: "Final sale",
        body: "Items marked final sale cannot be returned.",
      },
    ],
  },
  contact: {
    title: "Contact",
    intro: "A real person reads every message.",
    sections: [
      {
        heading: "Email",
        body: "support@shopsphere.example. We reply within one business day.",
      },
      {
        heading: "Orders",
        body: "Include your order number (SS-xxxxxx) so we can find it fast.",
      },
      {
        heading: "Hours",
        body: "Monday to Friday, 9:00 to 17:00 local time.",
      },
    ],
  },
};

export const SIZE_GUIDE = {
  title: "Size Guide",
  intro: "Sizing runs true unless a product page says otherwise. Between sizes? Go up.",
  sneakerHeaders: ["US", "UK", "EU", "CM"],
  sneakerRows: [
    ["7", "6", "40", "25.0"],
    ["8", "7", "41", "26.0"],
    ["9", "8", "42.5", "27.0"],
    ["10", "9", "44", "28.0"],
    ["11", "10", "45", "29.0"],
    ["12", "11", "46", "30.0"],
  ],
  apparelHeaders: ["Size", "Chest (in)", "Waist (in)", "Length (in)"],
  apparelRows: [
    ["S", "34-36", "28-30", "27"],
    ["M", "38-40", "32-34", "28"],
    ["L", "42-44", "36-38", "29"],
    ["XL", "46-48", "40-42", "30"],
  ],
  tip: "Measure your foot heel to toe, standing, at the end of the day.",
};
