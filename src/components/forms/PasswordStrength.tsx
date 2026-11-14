"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const score = React.useMemo(() => {
    let s = 0;
    if (password.length >= 8) s += 1;
    if (/[a-z]/.test(password)) s += 1;
    if (/[A-Z]/.test(password)) s += 1;
    if (/[0-9]/.test(password)) s += 1;
    if (/[^a-zA-Z0-9]/.test(password)) s += 1;
    return s;
  }, [password]);

  return (
    <div className="flex gap-1 h-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-full transition-all duration-200",
            i < score ? "bg-foreground" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}
