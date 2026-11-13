"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { EASE, DUR } from "@/animations/presets";
import { gsap } from "@/animations/gsap";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

/**
 * `true` after hydration. Uses `useSyncExternalStore` so the server render and
 * the first client render both report `false` (no hydration mismatch), and the
 * value flips to `true` immediately after mount — without a setState-in-effect.
 */
function useHydrated(): boolean {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const ref = React.useRef<HTMLButtonElement>(null);

  const isDark = hydrated && resolvedTheme === "dark";

  useMotion(
    ({ contextSafe }) => {
      const el = ref.current;
      if (!el) return;

      const rotate = contextSafe(() => {
        gsap.fromTo(
          el,
          { rotate: 0, scale: 1 },
          { rotate: 90, scale: 1.15, duration: DUR.fast, ease: EASE.snappy },
        );
      });

      el.addEventListener("click", rotate);
      return () => el.removeEventListener("click", rotate);
    },
    { scope: ref },
  );

  return (
    <button
      ref={ref}
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-input text-muted-foreground",
        "transition-colors duration-200 hover:bg-surface-2 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {/* Both icons are rendered; the toggle cross-fades via opacity. */}
      <span className="relative size-4">
        <Sun
          aria-hidden="true"
          className={cn(
            "absolute inset-0 size-4 transition-all duration-300",
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100",
          )}
        />
        <Moon
          aria-hidden="true"
          className={cn(
            "absolute inset-0 size-4 transition-all duration-300",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "-rotate-90 scale-0 opacity-0",
          )}
        />
      </span>
    </button>
  );
}
