"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { CartItem } from "@/components/shop/CartItem";
import { CartUpsell } from "@/components/shop/CartUpsell";
import { ShippingBar } from "@/components/shop/ShippingBar";
import { useCartSync } from "@/hooks/use-cart-sync";
import { useMounted } from "@/hooks/use-mounted";
import { formatPrice } from "@/lib/shop/format";
import { useCartStore } from "@/store/cartStore";
import { useCartUiStore } from "@/store/cartUiStore";
import { cn } from "@/lib/utils";

/** Global slide-over cart. Open with useCartUiStore().openCart() or the "shopsphere:open-cart" window event. */
export function CartDrawer() {
  const mounted = useMounted();
  const pathname = usePathname();
  const open = useCartUiStore((s) => s.open);
  const closeCart = useCartUiStore((s) => s.closeCart);
  const openCart = useCartUiStore((s) => s.openCart);
  const items = useCartStore((s) => s.items);
  const { hasUnavailable } = useCartSync({ enabled: mounted && open });

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  useEffect(() => {
    window.addEventListener("shopsphere:open-cart", openCart);
    return () => window.removeEventListener("shopsphere:open-cart", openCart);
  }, [openCart]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeCart();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeCart]);

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[60]">
          <motion.button
            type="button"
            aria-label="Close cart"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
          >
            <header className="flex items-center justify-between border-b border-border px-6 py-5">
              <h2 className="font-display text-xl">
                Your bag{" "}
                <span className="text-sm font-normal text-muted-foreground">({count})</span>
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl"
                onClick={closeCart}
                aria-label="Close cart"
              >
                <X className="size-4" />
              </Button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                  <ShoppingBag className="size-6" />
                </span>
                <p className="font-display text-xl">Your bag is empty</p>
                <p className="text-sm text-muted-foreground">
                  Find something worth wearing.
                </p>
                <Link
                  href="/products"
                  onClick={closeCart}
                  className={cn(buttonVariants(), "h-11 rounded-xl px-6")}
                >
                  Shop collection
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-border px-6 py-4">
                  <ShippingBar subtotal={subtotal} />
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ul className="space-y-6 px-6 py-6">
                    {items.map((item) => (
                      <CartItem
                        key={`${item.productId}-${item.size}`}
                        item={item}
                        onNavigate={closeCart}
                      />
                    ))}
                  </ul>
                  <CartUpsell onNavigate={closeCart} />
                </div>
                <footer className="space-y-4 border-t border-border px-6 py-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-lg font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Free shipping over $100. Tax calculated at checkout. Secure Stripe payment.
                  </p>
                  {hasUnavailable ? (
                    <p className="text-xs font-medium text-destructive">
                      Remove unavailable items to check out.
                    </p>
                  ) : null}
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    aria-disabled={hasUnavailable}
                    className={cn(
                      buttonVariants(),
                      "h-12 w-full rounded-xl text-sm font-semibold",
                      hasUnavailable && "pointer-events-none opacity-50",
                    )}
                  >
                    Checkout
                  </Link>
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "h-10 w-full rounded-xl text-sm",
                    )}
                  >
                    View full bag
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
