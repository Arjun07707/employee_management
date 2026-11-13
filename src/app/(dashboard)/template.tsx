"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";

/**
 * Re-mounts on every navigation into the (dashboard) group, so it drives the
 * enter animation. App Router has no exit animation, so this is enter-only.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);

  useMotion(
    () => {
      fadeUp(ref.current, { y: 12, duration: 0.35 });
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
