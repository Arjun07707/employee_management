"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { scaleIn, fadeUp } from "@/animations/presets";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  useMotion(
    () => {
      const icon = ref.current?.querySelector("[data-anim='icon']");
      if (icon) scaleIn(icon);
      const texts = ref.current?.querySelectorAll("[data-anim='text']");
      if (texts && texts.length > 0) {
        fadeUp(Array.from(texts), { stagger: 0.06, delay: 0.1 });
      }
    },
    { scope: ref },
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div ref={ref} className="flex flex-col items-center gap-6">
        <span
          data-anim="icon"
          className="inline-flex size-16 items-center justify-center"
        >
          <AlertTriangle
            className="size-16 text-muted-foreground"
            strokeWidth={1.25}
            aria-hidden="true"
          />
        </span>

        <div data-anim="text" className="space-y-2">
          <h1 className="page-title text-foreground">
            Something went <em>wrong</em>
            <span className="text-highlight" aria-hidden="true">
              .
            </span>
          </h1>
          <p className="max-w-md text-sm text-muted-foreground">
            An unexpected error occurred while loading this page. Try again, or
            head back to the dashboard.
          </p>
          {error.digest ? (
            <p className="caption mt-2 font-mono text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
        </div>

        <div data-anim="text" className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-input bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RotateCcw
              className="size-4"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
