"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shop/EmptyState";
import { OrderSummary } from "@/components/shop/OrderSummary";
import { ShippingBar } from "@/components/shop/ShippingBar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCartSync } from "@/hooks/use-cart-sync";
import { useMounted } from "@/hooks/use-mounted";
import { formatPrice } from "@/lib/shop/format";
import { useCartStore } from "@/store/cartStore";
import { cn } from "@/lib/utils";

/** Stored value is the country name (matches saved addresses). */
const COUNTRIES = [
  { value: "United States", label: "United States (US)" },
  { value: "Canada", label: "Canada (CA)" },
  { value: "United Kingdom", label: "United Kingdom (GB)" },
  { value: "India", label: "India (IN)" },
  { value: "Australia", label: "Australia (AU)" },
  { value: "Other", label: "Other" },
];

const CODE_TO_COUNTRY = { US: "United States", CA: "Canada", GB: "United Kingdom", IN: "India", AU: "Australia" };

const EMPTY = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

const FIELDS = [
  { name: "fullName", label: "Full name", autoComplete: "name", span: 2, required: true },
  { name: "phone", label: "Phone (optional)", autoComplete: "tel", type: "tel", span: 2 },
  { name: "line1", label: "Address", autoComplete: "address-line1", span: 2, required: true },
  { name: "line2", label: "Apartment, suite (optional)", autoComplete: "address-line2", span: 2 },
  { name: "city", label: "City", autoComplete: "address-level2", required: true },
  { name: "state", label: "State / region", autoComplete: "address-level1", required: true },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code", required: true },
];

const TRUST = [
  { icon: ShieldCheck, text: "Secure Stripe payment" },
  { icon: Lock, text: "SSL encrypted" },
  { icon: RotateCcw, text: "30-day returns" },
];

/**
 * Map a stored country (name or ISO code) to { choice, other }.
 * @param {string | undefined} value
 */
function resolveCountry(value) {
  const raw = (value ?? "").trim();
  if (!raw) return { choice: "United States", other: "" };
  const byCode = CODE_TO_COUNTRY[raw.toUpperCase()];
  if (byCode) return { choice: byCode, other: "" };
  const known = COUNTRIES.find(
    (c) => c.value !== "Other" && c.value.toLowerCase() === raw.toLowerCase(),
  );
  if (known) return { choice: known.value, other: "" };
  return { choice: "Other", other: raw.toLowerCase() === "other" ? "" : raw };
}

/**
 * @param {{ addresses?: object[], defaultName?: string }} props
 */
export function CheckoutForm({ addresses = [], defaultName = "" }) {
  const router = useRouter();
  const mounted = useMounted();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const { hasUnavailable } = useCartSync({ enabled: mounted });

  const initial = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [form, setForm] = useState(() =>
    initial
      ? { ...EMPTY, ...pick(initial) }
      : { ...EMPTY, fullName: defaultName },
  );
  const [country, setCountry] = useState(() => resolveCountry(initial?.country));
  const [saveAddress, setSaveAddress] = useState(false);
  const [busy, setBusy] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }));

  const countryValue =
    country.choice === "Other" ? country.other.trim() || "Other" : country.choice;

  async function persistAddress(address) {
    const body = JSON.stringify({ ...address, label: "Checkout", isDefault: false });
    const init = { headers: { "Content-Type": "application/json" }, body };
    const res = await fetch("/api/account/addresses", { method: "POST", ...init });
    if (res.status === 409) await fetch("/api/account/addresses", { method: "PUT", ...init });
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!items.length) return;
    if (hasUnavailable) {
      toast.error("Remove unavailable items from your bag to continue.");
      return;
    }
    setBusy(true);
    try {
      const shippingAddress = { ...form, country: countryValue };
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
          shippingAddress,
        }),
      });
      const json = await res.json().catch(() => null);

      if (res.status === 401) {
        router.push(`/sign-in?callbackUrl=${encodeURIComponent("/checkout")}`);
        return;
      }
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error ?? "Checkout failed. Please try again.");
      }

      if (saveAddress) persistAddress(shippingAddress).catch(() => {});

      const { url, orderId, demo } = json.data;
      if (url) {
        window.location.assign(url);
        return;
      }
      clearCart();
      router.push(`/checkout/success?order=${orderId}${demo ? "&demo=1" : ""}`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  if (!mounted) {
    return (
      <div className="grid gap-12 lg:grid-cols-[1fr_26rem]">
        <Skeleton className="h-[34rem] rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="Nothing to check out"
        description="Your bag is empty."
        action={{ href: "/products", label: "Shop collection" }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <ul
        aria-label="Checkout assurances"
        className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"
      >
        <li className="inline-flex items-center gap-1.5">
          <Lock className="size-3.5 text-primary" aria-hidden />
          Encrypted Stripe checkout
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Truck className="size-3.5 text-primary" aria-hidden />
          Free shipping over $100
        </li>
        <li className="inline-flex items-center gap-1.5">
          <RotateCcw className="size-3.5 text-primary" aria-hidden />
          30-day returns
        </li>
        <li className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden />
          Order confirmation by email
        </li>
      </ul>

      <div className="grid gap-12 lg:grid-cols-[1fr_26rem] lg:gap-16">
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-2xl">Shipping address</h2>
            {addresses.length > 1 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => {
                      setForm({ ...EMPTY, ...pick(a) });
                      setCountry(resolveCountry(a.country));
                    }}
                    className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm transition hover:border-primary"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.name} className={cn("space-y-2", f.span === 2 && "sm:col-span-2")}>
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input
                  id={f.name}
                  name={f.name}
                  type={f.type ?? "text"}
                  autoComplete={f.autoComplete}
                  required={f.required}
                  value={form[f.name]}
                  onChange={set(f.name)}
                  className="h-11 bg-card"
                />
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                name="country"
                autoComplete="country-name"
                required
                value={country.choice}
                onChange={(e) => setCountry((c) => ({ ...c, choice: e.target.value }))}
                className="h-11 w-full rounded-xl border border-input bg-card px-3 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {country.choice === "Other" ? (
              <div className="space-y-2">
                <Label htmlFor="countryOther">Country name</Label>
                <Input
                  id="countryOther"
                  name="countryOther"
                  required
                  value={country.other}
                  onChange={(e) => setCountry((c) => ({ ...c, other: e.target.value }))}
                  className="h-11 bg-card"
                />
              </div>
            ) : null}
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={saveAddress}
              onChange={(e) => setSaveAddress(e.target.checked)}
              className="size-4 rounded accent-[var(--primary)]"
            />
            Save this address to my account
          </label>
        </div>

        <aside className="h-fit space-y-6 rounded-xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl">Order summary</h2>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={`${item.productId}-${item.size}`} className="flex items-center gap-3">
                <div className="relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.image ? (
                    <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                  ) : null}
                  <span className="absolute top-0 right-0 flex size-5 items-center justify-center rounded-bl-lg bg-foreground text-[10px] font-semibold text-background">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">Size {item.size}</p>
                  {item.available === false ? (
                    <p className="text-xs font-medium text-destructive">Unavailable</p>
                  ) : null}
                </div>
                <p className="text-sm font-medium">{formatPrice(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <ShippingBar subtotal={subtotal} />
          <OrderSummary subtotal={subtotal} />

          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="size-4 text-primary" aria-hidden />
            Arrives in 3-6 business days
          </p>

          {hasUnavailable ? (
            <p className="text-xs font-medium text-destructive">
              Some items are unavailable.{" "}
              <Link href="/cart" className="underline underline-offset-4">
                Update your bag
              </Link>{" "}
              to continue.
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={busy || hasUnavailable}
            className="h-12 w-full rounded-xl text-sm font-semibold"
          >
            <Lock className="size-4" />
            {busy ? "Processing..." : "Pay securely"}
          </Button>

          <ul className="grid gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
            {TRUST.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-3.5 text-primary" aria-hidden />
                {text}
              </li>
            ))}
          </ul>

          <p className="text-center text-xs text-muted-foreground">
            Prices are confirmed on our servers.{" "}
            <Link href="/cart" className="underline underline-offset-4">
              Edit bag
            </Link>
          </p>
        </aside>
      </div>
    </form>
  );
}

function pick(a) {
  return {
    fullName: a.fullName ?? "",
    phone: a.phone ?? "",
    line1: a.line1 ?? "",
    line2: a.line2 ?? "",
    city: a.city ?? "",
    state: a.state ?? "",
    postalCode: a.postalCode ?? "",
  };
}
