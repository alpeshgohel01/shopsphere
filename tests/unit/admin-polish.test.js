import { describe, expect, it } from "vitest";
import { percentChange } from "@/lib/shop/trend";
import {
  addressDeleteSchema,
  newsletterSchema,
  orderStatusUpdateSchema,
} from "@/lib/shop/validators";

describe("percentChange", () => {
  it("computes up, down and flat", () => {
    expect(percentChange(150, 100)).toEqual({ pct: 50, direction: "up" });
    expect(percentChange(50, 100)).toEqual({ pct: -50, direction: "down" });
    expect(percentChange(100, 100)).toEqual({ pct: 0, direction: "flat" });
  });

  it("handles no prior data", () => {
    expect(percentChange(10, 0)).toEqual({ pct: null, direction: "new" });
    expect(percentChange(0, 0)).toEqual({ pct: 0, direction: "flat" });
  });
});

describe("newsletterSchema", () => {
  it("normalizes email", () => {
    expect(newsletterSchema.parse({ email: "  Me@Example.COM " }).email).toBe("me@example.com");
  });

  it("rejects invalid email", () => {
    expect(newsletterSchema.safeParse({ email: "nope" }).success).toBe(false);
    expect(newsletterSchema.safeParse({}).success).toBe(false);
  });
});

describe("orderStatusUpdateSchema", () => {
  it("accepts optional tracking details and drops blanks", () => {
    const r = orderStatusUpdateSchema.parse({
      status: "shipped",
      trackingNumber: " 1Z999 ",
      carrier: "",
    });
    expect(r.trackingNumber).toBe("1Z999");
    expect(r.carrier).toBeUndefined();
  });

  it("still works with status only", () => {
    expect(orderStatusUpdateSchema.parse({ status: "paid" }).status).toBe("paid");
  });
});

describe("addressDeleteSchema", () => {
  it("requires a label", () => {
    expect(addressDeleteSchema.parse({ label: " Home " }).label).toBe("Home");
    expect(addressDeleteSchema.safeParse({ label: "" }).success).toBe(false);
  });
});
