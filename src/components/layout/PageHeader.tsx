"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";
import { PageTitle } from "@/components/common/PageTitle";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  title: React.ReactNode;
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
    <div ref={ref} className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <PageTitle>{title}</PageTitle>
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
      <div aria-hidden="true" className="h-[5px] border-y border-border" />
    </div>
  );
}
