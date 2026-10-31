"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/users", label: "Users", icon: Users },
];

/**
 * Dark pine admin navigation (uses the --sidebar-* tokens from globals.css).
 * Vertical on md+, horizontal scroller on small screens.
 * @param {{ user?: { name?: string, email?: string } }} props
 */
export function AdminSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className="flex shrink-0 flex-col gap-4 bg-sidebar p-3 text-sidebar-foreground md:sticky md:top-0 md:h-svh md:w-60 md:gap-6 md:border-r md:border-sidebar-border md:p-4">
      <div className="flex items-center justify-between gap-2 px-1 md:block">
        <Link href="/admin" className="inline-flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-xl bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
            S
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold">ShopSphere</span>
            <span className="text-[10px] tracking-widest text-sidebar-foreground/60 uppercase">
              Admin
            </span>
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground md:hidden"
        >
          <Store className="size-3.5" />
          Store
        </Link>
      </div>

      <nav
        aria-label="Admin"
        className="flex gap-1 overflow-x-auto md:flex-1 md:flex-col md:overflow-visible"
      >
        {NAV.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden flex-col gap-2 border-t border-sidebar-border pt-4 md:flex">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <Store className="size-4" />
          View store
        </Link>
        {user ? (
          <div className="px-3 text-xs text-sidebar-foreground/60">
            <p className="truncate font-medium text-sidebar-foreground/90">
              {user.name || "Admin"}
            </p>
            <p className="truncate">{user.email}</p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
