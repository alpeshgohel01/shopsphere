"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @param {{ loading?: boolean, children: React.ReactNode, className?: string } & React.ComponentProps<typeof Button>} props
 */
export function SubmitButton({
  loading = false,
  children,
  className,
  disabled,
  type = "submit",
  ...props
}) {
  return (
    <Button
      type={type}
      size="lg"
      className={cn(
        "h-12 w-full rounded-xl bg-primary text-sm font-semibold tracking-tight text-primary-foreground shadow-none transition-[transform,background-color] hover:bg-primary/90 active:scale-[0.99] disabled:active:scale-100",
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden />
          <span>Please wait...</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
