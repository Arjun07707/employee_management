import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant =
  "default" | "primary" | "success" | "warning" | "danger" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-border text-foreground",
  primary: "border-border text-foreground",
  success: "border-border text-foreground",
  warning: "border-border text-foreground",
  danger: "border-foreground text-foreground",
  muted: "border-border text-muted-foreground",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export interface DotBadgeProps extends BadgeProps {
  dotClassName?: string;
}

/** Badge with a leading 6px status dot. */
export function DotBadge({
  className,
  variant = "default",
  dotClassName,
  ...props
}: DotBadgeProps) {
  return (
    <Badge variant={variant} className={cn("px-2.5", className)} {...props}>
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full bg-current",
          dotClassName,
        )}
      />
      {props.children}
    </Badge>
  );
}
