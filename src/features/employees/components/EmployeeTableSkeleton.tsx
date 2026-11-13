import { Skeleton } from "@/components/ui/skeleton";

/** Table-shaped loading placeholder with a shimmer. */
export function EmployeeTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="flex h-12 items-center gap-4 border-b border-border bg-surface px-4">
        {["w-40", "w-20", "w-24", "w-28", "w-24", "w-20", "w-20", "w-8"].map(
          (width, index) => (
            <Skeleton key={index} className={`h-3 ${width}`} />
          ),
        )}
      </div>

      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3.5">
            <Skeleton className="size-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-36" />
              <Skeleton className="h-2.5 w-48" />
            </div>
            <Skeleton className="hidden h-3 w-16 md:block" />
            <Skeleton className="hidden h-5 w-24 rounded-full md:block" />
            <Skeleton className="hidden h-3 w-28 lg:block" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
