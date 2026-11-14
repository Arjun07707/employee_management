"use client";

import * as React from "react";
import { AlertCircle, Eye, EyeOff, Lock } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PasswordFieldProps {
  id?: string;
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  showToggle?: boolean;
  error?: string;
}

export function PasswordField({
  id = "password",
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  showToggle = true,
  error,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock
          aria-hidden="true"
          strokeWidth={1.5}
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={id}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          autoComplete="current-password"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            "block w-full rounded-input border border-input bg-surface pl-9 pr-10 py-2 text-foreground placeholder-muted-foreground",
            "hover:border-foreground/40 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-foreground border-b-2 border-b-highlight" : "",
          )}
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {showPassword ? (
              <EyeOff className="size-4" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Eye className="size-4" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="caption flex items-center gap-1.5 text-highlight-ink animate-slide-down">
          <AlertCircle
            className="size-3.5 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          {error}
        </p>
      )}
    </div>
  );
}
