"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Account-area header for /dashboard and /settings (member workspace).
 * @param {{ user?: { name?: string, email?: string, image?: string | null, role?: string } }} props
 */
export function AppHeader({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const initials =
    user?.name
      ?.split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  const isActive = (item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

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

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-2.5"
          aria-label="ShopSphere account home"
        >
          <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            S
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold tracking-tight">
              ShopSphere
            </span>
            <span className="hidden text-[10px] tracking-[0.14em] text-muted-foreground uppercase sm:block">
              Account
            </span>
          </span>
        </Link>

        <nav
          aria-label="Account"
          className="ml-2 hidden items-center gap-0.5 md:flex"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium transition",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/products"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden h-9 rounded-xl sm:inline-flex",
            )}
          >
            <Store className="size-3.5" />
            Store
          </Link>
          <Link
            href="/cart"
            aria-label="Bag"
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "size-9 rounded-xl",
            )}
          >
            <ShoppingBag className="size-4" />
          </Link>
          <ThemeToggle />
          {user ? (
            <div className="ml-1 hidden items-center gap-2 border-l border-border pl-3 sm:flex">
              <Avatar size="sm">
                {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 leading-tight">
                <p className="max-w-[9rem] truncate text-sm font-medium">
                  {user.name || "Account"}
                </p>
                <p className="max-w-[9rem] truncate text-[11px] text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl"
            aria-label="Sign out"
            onClick={onSignOut}
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      <nav
        aria-label="Account mobile"
        className="flex gap-1 overflow-x-auto border-t border-border/50 px-3 py-2 md:hidden"
      >
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium",
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
