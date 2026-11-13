"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";
import { STAGGER } from "@/animations/presets";

export interface StaggerProps {
  children: React.ReactNode;
  as?: React.ElementType;
  /** Seconds between each child. */
  stagger?: number;
  /** Extra delay before the first child. */
  delay?: number;
  /** Re-run when this value changes (e.g. a page number). */
  reanimateKey?: unknown;
  className?: string;
}

/** Entrance animation for a group of children, staggered top to bottom. */
export function Stagger({
  children,
  as: Tag = "div",
  stagger = STAGGER.base,
  delay = 0,
  reanimateKey,
  className,
}: StaggerProps) {
  const ref = React.useRef<HTMLElement | null>(null);

  useMotion(
    () => {
      const items = ref.current?.children;
      if (!items || items.length === 0) return;
      fadeUp(Array.from(items), { stagger, delay });
    },
    { scope: ref, dependencies: [reanimateKey] },
  );

  return (
    <Tag ref={ref} className={className} data-anim="stagger">
      {children}
    </Tag>
  );
}
