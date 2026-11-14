import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="size-4" />
            </div>
            <div className="mt-4 border-t border-border pt-4">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="mt-2 h-4 w-28" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-card border border-border bg-surface p-5 shadow-card">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="mt-2 h-4 w-40" />
            <div className="mt-6 flex h-[280px] items-end gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="flex-1 rounded-t-[4px]"
                  style={{ height: `${30 + ((index * 17) % 60)}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-5 shadow-card">
          <Skeleton className="h-5 w-48" />
          <div className="mt-6 space-y-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <Skeleton className="h-5 w-44" />
        <div className="mt-4 divide-y divide-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 py-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-44" />
              </div>
              <Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
