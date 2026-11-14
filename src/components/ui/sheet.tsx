"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

type SheetContentProps = React.ComponentPropsWithoutRef<
  typeof SheetPrimitive.Content
> & {
  side?: "left" | "right";
};

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  function SheetContent({ className, children, side = "left", ...props }, ref) {
    return (
      <SheetPrimitive.Portal>
        <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-foreground/50 backdrop-blur-[2px] animate-fade-in" />
        <SheetPrimitive.Content
          ref={ref}
          className={cn(
            "fixed inset-y-0 z-50 flex w-[min(19rem,85vw)] flex-col rounded-dialog border border-border bg-surface shadow-card-md",
            side === "left"
              ? "left-0 animate-slide-in-left"
              : "right-0 animate-slide-in-right",
            className,
          )}
          {...props}
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            {children}
            <SheetPrimitive.Close
              aria-label="Close navigation"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" strokeWidth={1.5} />
            </SheetPrimitive.Close>
          </div>
        </SheetPrimitive.Content>
      </SheetPrimitive.Portal>
    );
  },
);
SheetContent.displayName = "SheetContent";
