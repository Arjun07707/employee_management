"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** Right-aligned meta, e.g. a result count. */
  meta?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  meta,
  className,
}: PageHeaderProps) {
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
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="page-title text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {meta ? (
          <p className="caption mt-2 text-muted-foreground">{meta}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
