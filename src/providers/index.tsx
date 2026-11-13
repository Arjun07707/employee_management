"use client";

import * as React from "react";
import { Toaster } from "sonner";

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
        toastOptions={{
          classNames: {
            toast:
              "rounded-input border border-border bg-surface text-foreground shadow-card-md",
            description: "text-muted-foreground",
            actionButton: "bg-primary text-white",
            cancelButton: "bg-surface-2 text-muted-foreground",
          },
        }}
      />
    </ThemeProvider>
  );
}
