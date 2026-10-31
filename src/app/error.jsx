"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** @param {{ error: Error & { digest?: string }, reset: () => void }} props */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-primary">Something went wrong</p>
        <h1 className="text-2xl font-semibold tracking-tight">Unexpected error</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          We hit a snag loading this page. You can try again or return home.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className={cn(buttonVariants({ variant: "default" }), "rounded-xl")}
        >
          Try again
        </button>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl")}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
