import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16"
      aria-busy="true"
      aria-label="Loading account"
    >
      <Skeleton className="h-14 w-64 rounded-xl" />
      <Skeleton className="mt-4 h-4 w-80 max-w-full rounded-lg" />
      <div className="mt-12 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-lg" />
              <Skeleton className="h-3 w-28 rounded-lg" />
            </div>
            <Skeleton className="h-6 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
