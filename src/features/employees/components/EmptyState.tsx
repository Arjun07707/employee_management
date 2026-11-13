"use client";

import * as React from "react";
import Link from "next/link";
import { SearchX, UserPlus } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";
import { Button } from "@/components/ui/button";

export interface EmptyStateProps {
  /** true = no records at all; false = no match for the current filters. */
  isEmpty: boolean;
  onClearFilters?: () => void;
}

export function EmptyState({ isEmpty, onClearFilters }: EmptyStateProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useMotion(
    () => {
      fadeUp(ref.current);
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <span className="inline-flex size-16 items-center justify-center rounded-full bg-primary-soft animate-float">
        {isEmpty ? (
          <UserPlus className="size-7 text-primary" aria-hidden="true" />
        ) : (
          <SearchX className="size-7 text-primary" aria-hidden="true" />
        )}
      </span>

      <div className="space-y-1">
        <p className="section-title text-foreground">
          {isEmpty ? "No employees yet" : "No results match your filters"}
        </p>
        <p className="text-sm text-muted-foreground">
          {isEmpty
            ? "Add your first employee to start building your team directory."
            : "Try adjusting the search or clearing the active filters."}
        </p>
      </div>

      {isEmpty ? (
        <Button asChild>
          <Link href="/employees/new">
            <UserPlus className="size-4" aria-hidden="true" />
            Add Employee
          </Link>
        </Button>
      ) : onClearFilters ? (
        <Button type="button" variant="outline" onClick={onClearFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
