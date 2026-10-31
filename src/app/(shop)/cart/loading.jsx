import { Skeleton } from "@/components/ui/skeleton";

export default function CartLoading() {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"
      aria-busy="true"
      aria-label="Loading bag"
    >
      <Skeleton className="mb-10 h-14 w-56 rounded-xl" />
      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="aspect-[4/5] w-24 rounded-xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-2/3 rounded-lg" />
                <Skeleton className="h-3 w-1/4 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
