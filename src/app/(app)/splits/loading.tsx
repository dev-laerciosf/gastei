import { Skeleton } from "@/components/ui/skeleton";

export default function SplitsLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Balance totals skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-20" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-[72px] rounded-lg" />
          <Skeleton className="h-[72px] rounded-lg" />
        </div>
      </div>

      {/* Splits skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
