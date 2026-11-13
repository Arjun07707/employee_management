"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";
import { cn } from "@/lib/utils";

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** One of the three section cards on the employee form. */
export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  const ref = React.useRef<HTMLElement>(null);

  // Section card fade-in + staggered fields inside the grid.
  useMotion(
    () => {
      if (ref.current) fadeUp(ref.current);
      const fields = ref.current?.querySelectorAll("[data-field]");
      if (fields && fields.length > 0) {
        fadeUp(fields, { stagger: 0.06, delay: 0.1, y: 10 });
      }
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={cn(
        "rounded-card border border-border bg-surface p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <header className="mb-5">
        <h2 className="section-title text-foreground">{title}</h2>
        {description ? (
          <p className="caption mt-1 text-muted-foreground">{description}</p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
