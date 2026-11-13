"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { EASE } from "@/animations/presets";
import { gsap } from "@/animations/gsap";
import { cn } from "@/lib/utils";

export interface AnimatedProgressProps {
  /** 0–100 */
  value: number;
  /** Bar colour. */
  color?: string;
  className?: string;
}

/**
 * Progress bar whose width tweens from 0 to the value. Width animation is one
 * of the two sanctioned exceptions to the "transform only" rule.
 */
export function AnimatedProgress({
  value,
  color = "var(--primary)",
  className,
}: AnimatedProgressProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useMotion(
    () => {
      const bar = ref.current;
      if (!bar) return;
      gsap.fromTo(
        bar,
        { width: "0%" },
        {
          width: `${Math.min(100, Math.max(0, value))}%`,
          duration: 0.9,
          ease: EASE.expo,
        },
      );
    },
    { scope: ref, dependencies: [value] },
  );

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Percent of total`}
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-surface-2",
        className,
      )}
    >
      <div
        ref={ref}
        className="h-full rounded-full"
        style={{ backgroundColor: color, width: `${value}%` }}
      />
    </div>
  );
}
