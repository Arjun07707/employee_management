"use client";

import type { RefObject } from "react";

import { gsap, useGSAP } from "./gsap";

interface MotionContext {
  contextSafe: <T extends (...args: never[]) => unknown>(fn: T) => T;
}

interface UseMotionOptions {
  scope: RefObject<HTMLElement | null>;
  dependencies?: unknown[];
}

/**
 * `useGSAP` + `gsap.matchMedia` so every animation is automatically skipped
 * when the user prefers reduced motion, and cleaned up on unmount/update.
 */
export function useMotion(
  fn: (ctx: MotionContext) => void,
  opts: UseMotionOptions,
) {
  useGSAP(
    (_instance, contextSafe) => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () =>
        fn({ contextSafe: contextSafe! }),
      );

      return () => mm.revert();
    },
    {
      scope: opts.scope,
      dependencies: opts.dependencies ?? [],
      revertOnUpdate: true,
    },
  );
}
