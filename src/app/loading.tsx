import { Skeleton } from "@/components/ui/skeleton";

/** Shell-level loading state shown while a route segment is resolving. */
export default function Loading() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar placeholder */}
      <div className="hidden w-[264px] shrink-0 border-r border-border bg-surface p-4 lg:block">
        <Skeleton className="h-9 w-40" />
        <div className="mt-8 space-y-3">
          <Skeleton className="h-3 w-20" />
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
          <Skeleton className="h-3 w-16" />
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      </div>

      <div className="flex-1">
        <div className="flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="hidden h-9 w-40 md:block" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </div>

        <div className="mx-auto max-w-[1280px] space-y-6 px-4 py-6 sm:px-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-36 rounded-card" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-card" />
        </div>
      </div>
    </div>
  );
}
