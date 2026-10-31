import { Skeleton } from "@/components/ui/skeleton";

export default function WishlistLoading() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"
      aria-busy="true"
      aria-label="Loading wishlist"
    >
      <Skeleton className="mb-10 h-14 w-56 rounded-xl" />
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/5] rounded-xl" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/3 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
