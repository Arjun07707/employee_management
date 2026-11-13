import * as React from "react";

import { initials, gradientFromName } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-16 text-xl",
  xl: "size-20 text-2xl",
} as const;

export interface AvatarProps {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
  /** Hide the gradient and render a plain tinted circle. */
  flat?: boolean;
}

export function Avatar({
  name,
  size = "md",
  className,
  flat = false,
}: AvatarProps) {
  return (
    <span
      role="img"
      aria-label={name}
      style={flat ? undefined : { backgroundImage: gradientFromName(name) }}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold text-white",
        sizes[size],
        flat && "bg-primary-soft text-primary",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
