import * as React from "react";

import { initials, tintIndex } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
  xl: "size-20 text-2xl",
} as const;

/** Four neutral tones; no gradients. Order matters (index = tintIndex % 4). */
const tones = [
  "bg-primary text-primary-foreground",
  "bg-surface-2 text-foreground",
  "bg-border-strong text-foreground",
  "border border-primary text-foreground",
] as const;

export interface AvatarProps {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  const tone = tones[tintIndex(name)]!;

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold",
        sizes[size],
        tone,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
