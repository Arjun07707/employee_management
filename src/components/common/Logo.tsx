import * as React from "react";

import { cn } from "@/lib/utils";

export interface LogoProps {
  size?: number;
  className?: string;
  /** Render the mark plus the app name. */
  withName?: boolean;
  nameClassName?: string;
}

/** Ink mark (solid rounded square with paper "E" rules) — optionally followed by a serif wordmark and a single highlight dot. */
export function Logo({
  size = 32,
  className,
  withName = false,
  nameClassName,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="40" height="40" rx="12" fill="var(--foreground)" />
        <path
          d="M13 12.5h14M13 20h10M13 27.5h14"
          stroke="var(--background)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {withName ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "font-display text-base font-normal tracking-tight text-foreground",
              nameClassName,
            )}
          >
            Employee Management
          </span>
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-highlight"
          />
        </span>
      ) : null}
    </span>
  );
}
