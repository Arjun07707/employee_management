"use client";

import * as React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { scaleIn } from "@/animations/presets";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useMotion(
    () => {
      scaleIn(ref.current);
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-card border border-border bg-surface px-6 py-12 text-center"
    >
      <AlertTriangle
        className="size-12 text-muted-foreground"
        strokeWidth={1.25}
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-display text-2xl leading-8 tracking-[-0.02em] text-foreground">
          {title}
          <span aria-hidden="true" className="text-highlight">
            .
          </span>
        </p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onRetry}
          loading={retrying}
        >
          <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
