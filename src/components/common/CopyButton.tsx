"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface CopyButtonProps {
  value: string;
  /** Tooltip text, e.g. "Copy employee ID". */
  label?: string;
  className?: string;
}

/** Copies `value` to the clipboard and shows "Copied" for 1.5s. */
export function CopyButton({
  value,
  label = "Copy",
  className,
}: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (permissions / insecure context) — no-op.
    }
  }, [value]);

  return (
    <Tooltip label={copied ? "Copied" : label} side="top">
      <button
        type="button"
        onClick={onCopy}
        aria-label={copied ? "Copied" : label}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground",
          "transition-colors duration-200 hover:bg-surface-2 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          copied && "text-success",
          className,
        )}
      >
        {copied ? (
          <Check className="size-4" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
      </button>
    </Tooltip>
  );
}
