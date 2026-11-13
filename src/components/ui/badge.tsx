import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant =
  "default" | "primary" | "success" | "warning" | "danger" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-2 text-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/12 text-danger",
  muted: "bg-surface-2 text-muted-foreground",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
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
