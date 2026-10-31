import { describe, expect, it } from "vitest";
import { buildOrderSteps } from "@/components/shop/OrderTimeline";
import { buildProductJsonLd, jsonLdString } from "@/lib/shop/product-schema";
import { stockStatus } from "@/lib/shop/stock";
import { productListQuerySchema } from "@/lib/shop/validators";

describe("buildOrderSteps", () => {
  it("marks only Placed for a pending order", () => {
    const steps = buildOrderSteps({ status: "pending", paymentStatus: "unpaid", createdAt: "2026-01-01T00:00:00Z" });
    expect(steps.map((s) => s.done)).toEqual([true, false, false, false]);
  });

  it("marks Paid and Shipped from status and dates", () => {
    const steps = buildOrderSteps({
      status: "shipped",
      paymentStatus: "paid",
      createdAt: "2026-01-01T00:00:00Z",
      paidAt: "2026-01-01T00:05:00Z",
      shippedAt: "2026-01-02T00:00:00Z",
    });
    expect(steps.map((s) => s.done)).toEqual([true, true, true, false]);
    expect(steps[2].date).toBe("2026-01-02T00:00:00Z");
  });
});

describe("stockStatus", () => {
  it("classifies out, low and in stock", () => {
    expect(stockStatus({ variants: [{ stock: 0 }] }).state).toBe("out");
    expect(stockStatus({ variants: [{ stock: 2 }, { stock: 1 }] }).state).toBe("low");
    expect(stockStatus({ variants: [{ stock: 20 }] }).state).toBe("in");
  });
});

describe("productListQuerySchema sale/rating", () => {
  it("parses sale and rating", () => {
    const q = productListQuerySchema.parse({ sale: "1", rating: "4" });
    expect(q.sale).toBe(true);
    expect(q.rating).toBe(4);
  });

  it("ignores junk rating", () => {
    expect(productListQuerySchema.parse({ rating: "9" }).rating).toBeUndefined();
    expect(productListQuerySchema.parse({ rating: "" }).rating).toBeUndefined();
  });
});

describe("product JSON-LD", () => {
  const product = {
    id: "abc",
    slug: "runner",
    title: "Runner </script>",
    price: 12900,
    ratingAvg: 4.5,
    ratingCount: 3,
    images: [{ url: "https://example.com/a.jpg" }],
    variants: [{ size: "9", stock: 4 }],
  };

  it("builds an offer in dollars with availability", () => {
    const ld = buildProductJsonLd(product, "https://shop.example");
    expect(ld.offers.price).toBe("129.00");
    expect(ld.offers.availability).toBe("https://schema.org/InStock");
    expect(ld.aggregateRating.reviewCount).toBe(3);
  });

  it("escapes angle brackets for inline script use", () => {
    expect(jsonLdString(buildProductJsonLd(product, "https://shop.example"))).not.toContain("</script>");
  });
});
