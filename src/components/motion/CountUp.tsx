"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { countUp } from "@/animations/count-up";
import { cn } from "@/lib/utils";

export interface CountUpProps {
  value: number;
  /** Formats each step (defaults to the plain integer). */
  format?: (value: number) => string;
  duration?: number;
  className?: string;
}

/** Animated number that tweens from 0 to `value` once on mount. */
export function CountUp({
  value,
  format = (n) => String(n),
  duration = 1.2,
  className,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);

  useMotion(
    () => {
      const el = ref.current;
      if (!el) return;
      const tween = countUp(el, value, format, duration);
      return () => {
        tween.kill();
      };
    },
    { scope: ref, dependencies: [value] },
  );

  return (
    <span ref={ref} className={cn("inline-block tabular", className)}>
      {format(0)}
    </span>
  );
}
