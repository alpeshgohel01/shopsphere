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
  variant = "default",
  ...props
}) {
  const isPrimary = variant === "default";

  return (
    <Button
      type={type}
      size="lg"
      variant={variant}
      className={cn(
        "h-12 w-full rounded-xl text-sm font-semibold tracking-tight shadow-none transition-[transform,background-color] active:scale-[0.99] disabled:active:scale-100",
        isPrimary &&
          "bg-primary text-primary-foreground hover:bg-primary/90",
        !isPrimary && "text-foreground",
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
