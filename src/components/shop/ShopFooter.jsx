import Link from "next/link";
import { CATEGORIES } from "@/lib/shop/constants";
import { FOOTER } from "@/lib/shop/copy";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All products" },
      { href: "/products?sort=newest", label: "New arrivals" },
      { href: "/products?sale=1", label: "Sale" },
      ...CATEGORIES.slice(0, 2).map((c) => ({
        href: `/products?category=${encodeURIComponent(c.name)}`,
        label: c.label,
      })),
    ],
  },
  {
    title: "Help",
    links: FOOTER.help,
  },
  {
    title: "Account",
    links: [
      { href: "/dashboard", label: "Account" },
      { href: "/account/orders", label: "Orders" },
      { href: "/wishlist", label: "Wishlist" },
      { href: "/cart", label: "Bag" },
    ],
  },
  {
    title: "Join",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Create account" },
    ],
  },
];

export function ShopFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-foreground text-background dark:bg-card dark:text-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs sm:col-span-2 md:col-span-1">
            <p className="font-display text-3xl">ShopSphere</p>
            <p className="mt-3 text-sm opacity-70">{FOOTER.tagline}</p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-sans text-xs font-semibold tracking-[0.14em] uppercase opacity-60">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm opacity-85 transition hover:text-highlight hover:opacity-100"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col justify-between gap-3 border-t border-current/15 pt-6 text-xs opacity-60 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} ShopSphere. {FOOTER.legal}
          </p>
          <p>{FOOTER.sign}</p>
        </div>
      </div>
    </footer>
  );
}
