import * as React from "react";

import { cn } from "@/lib/utils";

export interface LogoProps {
  size?: number;
  className?: string;
  /** Render the mark plus the app name. */
  withName?: boolean;
  nameClassName?: string;
}

/** SVG aurora mark — three overlapping rounded shapes forming an "E". */
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
        <defs>
          <linearGradient id="logo-aurora" x1="0" y1="0" x2="40" y2="40">
            <stop offset="0%" stopColor="#5B5BD6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="12" fill="url(#logo-aurora)" />
        <path
          d="M13 12.5h14M13 20h10M13 27.5h14"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {withName ? (
        <span
          className={cn(
            "text-base font-bold tracking-tight text-foreground",
            nameClassName,
          )}
        >
          Employee Management
        </span>
      ) : null}
    </span>
  );
}
