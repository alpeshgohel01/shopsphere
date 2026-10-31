import { BadgeCheck } from "lucide-react";
import { RatingStars } from "@/components/shop/RatingStars";
import { EMPTY } from "@/lib/shop/copy";
import { formatDate } from "@/lib/shop/format";

/** @param {{ reviews: { id: string, userName: string, rating: number, comment: string, createdAt: string }[] }} props */
export function ReviewList({ reviews }) {
  if (!reviews?.length) {
    return (
      <p className="py-8 text-sm text-muted-foreground">{EMPTY.reviews}</p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {reviews.map((review) => (
        <li key={review.id} className="space-y-2 py-6 first:pt-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-sm font-semibold text-accent-foreground">
                {(review.userName || "C").slice(0, 1).toUpperCase()}
              </span>
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {review.userName}
                  {review.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">
                      <BadgeCheck aria-hidden className="size-3" />
                      Verified purchase
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(review.createdAt)}
                </p>
              </div>
            </div>
            <RatingStars rating={review.rating} showCount={false} />
          </div>
          <p className="text-sm leading-relaxed text-foreground/85">{review.comment}</p>
        </li>
      ))}
    </ul>
  );
}
