"use client";

import * as React from "react";
import { Toaster } from "sonner";
import { AlertCircle, AlertTriangle, Check, Info, Loader2 } from "lucide-react";

import { ThemeProvider } from "@/providers/theme-provider";
import { QueryProvider } from "@/providers/query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>{children}</QueryProvider>
      <Toaster
        position="top-right"
        icons={{
          success: (
            <Check className="size-4" strokeWidth={1.5} aria-hidden="true" />
          ),
          info: (
            <Info className="size-4" strokeWidth={1.5} aria-hidden="true" />
          ),
          warning: (
            <AlertTriangle
              className="size-4"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ),
          error: (
            <AlertCircle
              className="size-4"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ),
          loading: (
            <Loader2
              className="size-4 animate-spin"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          ),
        }}
        toastOptions={{
          classNames: {
            toast:
              "rounded-input font-sans text-sm! border-border! bg-primary! text-primary-foreground! shadow-card-md!",
            description: "text-primary-foreground/70!",
            actionButton: "bg-primary-foreground! text-primary!",
            cancelButton: "bg-primary-foreground/10! text-primary-foreground!",
            error: "border-l-2! border-l-highlight!",
          },
        }}
      />
    </ThemeProvider>
  );
}
