"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-11 w-full rounded-input border border-border-strong bg-surface px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted-foreground/70",
          "[transition:border-color_0.2s,box-shadow_0.2s,background-color_0.2s,background-size_0.25s_cubic-bezier(0.165,0.84,0.44,1)]",
          "hover:border-foreground/40",
          "focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "[background-image:linear-gradient(var(--highlight),var(--highlight))] [background-position:left_bottom] [background-size:0%_2px] bg-no-repeat",
          "aria-[invalid=true]:border-foreground aria-[invalid=true]:[background-size:100%_2px]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
