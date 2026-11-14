"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Flip } from "@/animations/gsap";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Builds [1, …, p-1, p, p+1, …, n] with ellipsis markers. */
function pageRange(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let previous = 0;

  for (const value of sorted) {
    if (value - previous === 2) {
      result.push(previous + 1);
    } else if (value - previous > 2) {
      result.push("ellipsis");
    }
    result.push(value);
    previous = value;
  }

  return result;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
}: PaginationProps) {
  const pillRef = React.useRef<HTMLButtonElement>(null);
  const range = pageRange(page, Math.max(1, totalPages));

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Flip the active pill to the new page number.
  React.useLayoutEffect(() => {
    const pill = pillRef.current;
    if (!pill) return;

    const state = Flip.getState(pill);
    pill.dataset.page = String(page);
    Flip.from(state, { duration: 0.3, ease: "power2.out" });
  }, [page]);

  if (totalPages <= 1 && total <= limit) {
    return (
      <div className={cn("flex items-center justify-between gap-4", className)}>
        <p className="caption text-muted-foreground">
          Showing {from}–{to} of {total}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-4 sm:flex-row",
        className,
      )}
    >
      <p className="caption text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="inline-flex size-9 items-center justify-center rounded-input border border-border-strong bg-surface text-foreground transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft
            className="size-4"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>

        {range.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="px-1.5 text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              ref={item === page ? pillRef : undefined}
              data-page={item}
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              aria-label={`Page ${item}`}
              className={cn(
                "relative inline-flex h-9 min-w-9 items-center justify-center rounded-input px-2 text-sm font-medium transition-colors",
                item === page
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {item}
              {item === page ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-1.5 bottom-1.5 h-0.5 bg-highlight"
                />
              ) : null}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          className="inline-flex size-9 items-center justify-center rounded-input border border-border-strong bg-surface text-foreground transition-colors hover:bg-surface-2 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight
            className="size-4"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>
      </nav>
    </div>
  );
}
