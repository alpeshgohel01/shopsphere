"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart,
  LogIn,
  LogOut,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { SearchSuggest } from "@/components/shop/SearchSuggest";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMounted } from "@/hooks/use-mounted";
import { signOut } from "@/lib/auth-client";
import { useCartStore } from "@/store/cartStore";
import { useCartUiStore } from "@/store/cartUiStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/products", label: "Shop" },
  { href: "/products?sort=newest", label: "New" },
  { href: "/products?sale=1", label: "Sale" },
];

function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span
      key={count}
      className="cart-badge-bounce absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-highlight px-1 text-[10px] leading-4.5 font-bold text-highlight-foreground"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * @param {{ user?: { name?: string, email?: string, image?: string | null, role?: string } | null }} props
 */
export function ShopNavbar({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const mounted = useMounted();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlistStore((s) => s.ids.length);
  const openCart = useCartUiStore((s) => s.openCart);

  const initials =
    user?.name
      ?.split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  function goSearch(term) {
    const q = (term ?? query).trim();
    if (!q) return;
    setQuery(q);
    setSearchOpen(false);
    setMobileOpen(false);
    router.push(`/products?q=${encodeURIComponent(q)}`);
  }

  function onSearch(event) {
    event.preventDefault();
    goSearch(query);
  }

  async function onSignOut() {
    try {
      await signOut();
      toast.success("Signed out");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Could not sign out");
    }
  }

  const iconBtn = "relative size-9 rounded-xl";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-xl md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>

        <Link
          href="/"
          className="font-display text-xl leading-none tracking-tight md:w-40"
          aria-label="ShopSphere home"
        >
          ShopSphere
          <span className="ml-0.5 inline-block size-1.5 rounded-full bg-highlight align-baseline ring-1 ring-primary/30" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Main">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                l.label === "Shop" && pathname.startsWith("/products") && "text-foreground",
                l.label === "Sale" && "text-primary",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-0.5 md:ml-0 md:w-40 md:justify-end md:gap-1 lg:w-auto">
          <AnimatePresence initial={false}>
            {searchOpen ? (
              <motion.form
                key="search"
                onSubmit={onSearch}
                className="relative hidden overflow-visible md:block"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <SearchSuggest
                  autoFocus
                  value={query}
                  onChange={setQuery}
                  onSubmitSearch={goSearch}
                  className="w-[280px]"
                />
              </motion.form>
            ) : null}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            className={cn(iconBtn, "hidden md:inline-flex")}
            aria-label={searchOpen ? "Close search" : "Search"}
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <X className="size-[18px]" /> : <Search className="size-[18px]" />}
          </Button>

          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), iconBtn, "hidden sm:inline-flex")}
          >
            <Heart className="size-[18px]" />
            <CountBadge count={mounted ? wishCount : 0} />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className={iconBtn}
            aria-label={`Open cart${mounted && cartCount ? `, ${cartCount} items` : ""}`}
            onClick={openCart}
          >
            <ShoppingBag className="size-[18px]" />
            <CountBadge count={mounted ? cartCount : 0} />
          </Button>

          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                className="ml-1 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <Avatar>
                  {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {user.name || "Account"}
                    </span>
                    <span className="block truncate font-normal">{user.email}</span>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/dashboard" />} className="rounded-lg py-2">
                  <User /> Account
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/orders" />} className="rounded-lg py-2">
                  <Package /> Orders
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/wishlist" />} className="rounded-lg py-2">
                  <Heart /> Wishlist
                </DropdownMenuItem>
                {user.role === "admin" ? (
                  <DropdownMenuItem render={<Link href="/admin" />} className="rounded-lg py-2">
                    <ShieldCheck /> Admin
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut} className="rounded-lg py-2">
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "ghost" }), "ml-1 h-9 rounded-xl px-3 text-sm")}
            >
              <LogIn className="size-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            key="mobile"
            className="overflow-hidden border-t border-border/60 md:hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="space-y-5 px-4 py-5">
              <form onSubmit={onSearch}>
                <SearchSuggest
                  value={query}
                  onChange={setQuery}
                  onSubmitSearch={goSearch}
                  variant="panel"
                  placeholder="Search products"
                />
              </form>
              <nav className="flex flex-col" aria-label="Mobile">
                {[...LINKS, { href: "/wishlist", label: "Wishlist" }].map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-display border-b border-border/50 py-3.5 text-2xl"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
