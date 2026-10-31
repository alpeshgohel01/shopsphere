"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * @param {{ productId: string, signedIn: boolean, canReview?: boolean }} props
 */
export function ReviewForm({ productId, signedIn, canReview = true }) {
  const router = useRouter();
  const pathname = usePathname();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (!signedIn) {
    return (
      <p className="rounded-xl bg-muted px-5 py-4 text-sm text-muted-foreground">
        <Link
          href={`/sign-in?callbackUrl=${encodeURIComponent(pathname)}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>{" "}
        to review products you&apos;ve purchased.
      </p>
    );
  }

  if (!canReview) {
    return (
      <p className="rounded-xl bg-muted px-5 py-4 text-sm text-muted-foreground">
        Reviews are open to verified buyers. Purchase this product to share yours.
      </p>
    );
  }

  async function onSubmit(event) {
    event.preventDefault();
    if (!rating) return toast.error("Pick a star rating");
    if (comment.trim().length < 3) return toast.error("Write a short comment");
    setBusy(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error ?? "Could not post review");
      toast.success("Thanks for the review");
      setRating(0);
      setComment("");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  const shown = hover || rating;

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-border bg-card p-5">
      <p className="text-sm font-semibold">Write a review</p>
      <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="rounded p-0.5"
          >
            <Star
              className={cn(
                "size-6 transition",
                n <= shown ? "fill-primary text-primary" : "text-muted-foreground/40",
              )}
            />
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How do they fit and feel?"
        maxLength={2000}
        className="min-h-24 rounded-xl"
      />
      <Button type="submit" disabled={busy} className="h-11 rounded-xl px-6">
        {busy ? "Posting..." : "Post review"}
      </Button>
    </form>
  );
}
