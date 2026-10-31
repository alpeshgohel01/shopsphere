import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <Skeleton className="h-14 w-72 rounded-xl" />
      <Skeleton className="mt-4 h-4 w-96 max-w-full rounded-lg" />
      <div className="mt-14 grid gap-10 lg:grid-cols-[17rem_1fr] lg:gap-14">
        <div className="hidden space-y-6 lg:block">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/3 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
