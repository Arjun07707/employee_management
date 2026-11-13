"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";

export interface RevealProps {
  children: React.ReactNode;
  /** Element type to render. Defaults to a `div`. */
  as?: React.ElementType;
  /** Extra delay in seconds before the reveal starts. */
  delay?: number;
  className?: string;
}

/** Fade + slide up entrance for a single element or its direct children. */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);

  useMotion(
    () => {
      fadeUp(
        ref.current?.children.length
          ? Array.from(ref.current.children)
          : ref.current,
        {
          delay,
        },
      );
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
