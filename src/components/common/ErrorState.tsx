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
      className="flex flex-col items-center justify-center gap-4 rounded-card border border-danger/25 bg-danger/5 px-6 py-12 text-center"
    >
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-danger/12">
        <AlertTriangle className="size-6 text-danger" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="section-title text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          loading={retrying}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
