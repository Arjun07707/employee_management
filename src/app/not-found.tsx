import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <FileQuestion
        className="size-16 text-muted-foreground"
        strokeWidth={1.25}
        aria-hidden="true"
      />

      <p className="stat-number animate-rotate-settle text-8xl text-foreground">
        404
      </p>

      <div className="space-y-2">
        <h1 className="page-title text-foreground">
          Page not <em>found</em>
          <span className="text-highlight" aria-hidden="true">
            .
          </span>
        </h1>
        <p className="text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex h-11 items-center justify-center rounded-input bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Back to dashboard
      </Link>

      <div className="sr-only" aria-hidden="true">
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
