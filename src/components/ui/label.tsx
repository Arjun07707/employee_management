"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

type LabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  function Label({ className, ...props }, ref) {
    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn(
          "text-xs font-medium leading-5 text-foreground",
          "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Label.displayName = "Label";
