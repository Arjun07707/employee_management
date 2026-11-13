"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "link";

type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-card hover:bg-primary-hover hover:shadow-card-lg dark:text-background",
  secondary:
    "bg-primary-soft text-primary hover:brightness-95 dark:hover:brightness-125",
  outline: "border border-border bg-surface text-foreground hover:bg-surface-2",
  ghost: "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
  danger: "bg-danger text-white hover:brightness-110 dark:text-background",
  success: "bg-success text-white hover:brightness-110 dark:text-background",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10",
};

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

    // asChild must pass the child through untouched (Slot expects exactly one
    // element child), so the loading spinner / label wrapper only exists for
    // the real <button> rendering.
    if (asChild) {
      return (
        <Comp
          ref={ref}
          data-slot="button"
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-input font-medium",
            "transition-[background-color,box-shadow,transform] duration-200",
            "disabled:pointer-events-none disabled:opacity-50",
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
          "inline-flex shrink-0 items-center justify-center rounded-input font-medium",
          "transition-[background-color,box-shadow,transform] duration-200",
          "disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
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
      </Comp>
    );
  },
);
Button.displayName = "Button";
