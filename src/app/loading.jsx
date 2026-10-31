import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
      <Skeleton className="size-10 rounded-xl" />
      <Skeleton className="h-4 w-48 rounded-lg" />
      <Skeleton className="h-4 w-32 rounded-lg" />
    </div>
  );
}
