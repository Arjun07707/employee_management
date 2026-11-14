"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ArrowUpRight, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "danger"
  | "success"
  | "link";

type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:opacity-90",
  secondary:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-2",
  outline:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-2",
  ghost: "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
  destructive:
    "border border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  danger:
    "border border-primary text-primary hover:bg-primary hover:text-primary-foreground",
  success: "bg-primary text-primary-foreground hover:opacity-90",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-11 w-11",
};

/** Trailing arrow only on solid primary buttons at interactive sizes. */
function showArrow(
  variant: ButtonVariant,
  size: ButtonSize,
  loading: boolean,
  asChild: boolean,
) {
  return (
    variant === "primary" &&
    (size === "md" || size === "lg") &&
    !loading &&
    !asChild
  );
}

const baseClasses = [
  "group inline-flex shrink-0 items-center justify-center rounded-input",
  "font-medium leading-5 transition-[background-color,opacity,border-color,box-shadow,transform] duration-200",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      asChild = false,
      loading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const withArrow = showArrow(variant, size, loading, asChild);

    // asChild must pass the child through untouched (Slot expects exactly one
    // element child), so the loading spinner / label wrapper only exists for
    // the real <button> rendering.
    if (asChild) {
      return (
        <Comp
          ref={ref}
          data-slot="button"
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            className,
          )}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2
              className="size-4 shrink-0 animate-spin"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            {loadingText ? <span>{loadingText}</span> : null}
          </>
        ) : null}
        <span
          className={cn(
            "inline-flex items-center gap-2",
            loading && "opacity-0",
          )}
          aria-hidden={loading || undefined}
        >
          {children}
        </span>
        {withArrow ? (
          <ArrowUpRight
            className="size-4 shrink-0 transition-all duration-200 ease-out group-hover:translate-x-[3px] group-hover:text-highlight"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        ) : null}
      </Comp>
    );
  },
);
Button.displayName = "Button";
