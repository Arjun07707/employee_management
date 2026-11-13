import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <p className="stat-number animate-rotate-settle text-8xl font-bold text-primary">
        404
      </p>

      <div className="space-y-2">
        <h1 className="page-title text-foreground">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="animate-pulse-cta inline-flex h-10 items-center justify-center rounded-input bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-hover dark:text-background"
      >
        Back to dashboard
      </Link>

      <div className="sr-only" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
