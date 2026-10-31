import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
      aria-busy="true"
      aria-label="Loading checkout"
    >
      <Skeleton className="h-14 w-56 rounded-xl" />
      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-xl" />
          ))}
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="aspect-[4/5] w-16 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/3 rounded-lg" />
              </div>
            </div>
          ))}
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-5 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
