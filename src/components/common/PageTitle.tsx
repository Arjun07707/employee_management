"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { gsap, SplitText } from "@/animations/gsap";

/**
 * Serif page title with a masked line reveal.
 *
 * Re-splits after fonts load and on resize (autoSplit), and does not replay on
 * refetch because `useMotion` is scoped to the element.
 */
export function PageTitle({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLHeadingElement>(null);

  useMotion(
    () => {
      const el = ref.current;
      if (!el) return;

      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.8,
            ease: "expo.out",
            stagger: 0.08,
          }),
      });
    },
    { scope: ref },
  );

  return (
    <h1
      ref={ref}
      className="page-title text-foreground"
    >
      {children}
    </h1>
  );
}
