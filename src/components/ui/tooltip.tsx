"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface TooltipProps {
  /** Text shown on hover/focus. */
  label: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

/**
 * Lightweight CSS/JS tooltip — no portal, focus-visible and hover both trigger
 * it, and it is hidden from assistive tech (the trigger should carry the
 * accessible name via aria-label).
 */
export function Tooltip({
  label,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  const positions: Record<NonNullable<TooltipProps["side"]>, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <span
      className={cn("relative inline-flex", className)}
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open ? (
        <span
          id={id}
          role="tooltip"
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-card animate-fade-in",
            positions[side],
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
