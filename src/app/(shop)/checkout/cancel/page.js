import Link from "next/link";
import { XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Checkout cancelled" };

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center sm:py-28">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <XCircle className="size-8" />
      </span>
      <h1 className="font-display mt-8 text-5xl leading-none">Payment cancelled</h1>
      <p className="mt-4 text-muted-foreground">
        No charge was made. Your bag is saved if you want to try again.
      </p>
      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/checkout"
          className={cn(buttonVariants(), "h-12 rounded-xl px-7 text-sm font-semibold")}
        >
          Return to checkout
        </Link>
        <Link
          href="/cart"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-12 rounded-xl px-7 text-sm font-semibold",
          )}
        >
          View bag
        </Link>
      </div>
    </div>
  );
}
