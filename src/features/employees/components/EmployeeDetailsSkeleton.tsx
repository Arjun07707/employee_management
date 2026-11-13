import { Skeleton } from "@/components/ui/skeleton";

export function EmployeeDetailsSkeleton() {
  return (
    <div className="space-y-5">
      <div className="rounded-card border border-border bg-surface p-6 shadow-card">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-card border border-border bg-surface p-5 shadow-card"
          >
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: index === 2 ? 1 : 2 }).map((__, row) => (
                <div key={row} className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-md" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-2.5 w-16" />
                    <Skeleton className="h-3.5 w-40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <Skeleton className="h-5 w-24" />
        <div className="mt-4 space-y-4 border-l border-border pl-5">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-8 w-40" />
        </div>
      </div>
    </div>
  );
}
