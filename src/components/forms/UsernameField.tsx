"use client";

import * as React from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";

import {
  useUsernameAvailability,
  type UsernameStatus,
} from "@/hooks/use-username-availability";
import { Label } from "@/components/ui/label";
import { USERNAME_MAX } from "@/shared/constants";
import { cn } from "@/lib/utils";

export interface UsernameFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onStatusChange?: (status: UsernameStatus) => void;
  forEmployeeId?: string;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Run the live availability check (api call). Disable on the login page,
     where checking "availability" is meaningless and hits an auth-only endpoint. */
  checkAvailability?: boolean;
}

const BLOCKING: UsernameStatus[] = ["taken", "invalid", "reserved"];

export function UsernameField({
  id = "username",
  label = "Username",
  value,
  onChange,
  onStatusChange,
  forEmployeeId,
  error,
  disabled,
  autoFocus,
  checkAvailability = true,
}: UsernameFieldProps) {
  const { status, message, isOk, suggestions } = useUsernameAvailability(
    value,
    { forEmployeeId, enabled: checkAvailability },
  );

  React.useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const blocking = error ? true : BLOCKING.includes(status);

  const statusIcon = () => {
    if (status === "checking") {
      return (
        <Loader2
          className="size-4 animate-spin text-foreground"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      );
    }
    if (isOk)
      return (
        <Check
          className="size-4 text-foreground"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      );
    if (blocking)
      return (
        <AlertCircle
          className="size-4 text-highlight"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      );
    return null;
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type="text"
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          inputMode="text"
          maxLength={USERNAME_MAX}
          onChange={(event) => onChange(event.target.value.toLowerCase())}
          aria-invalid={blocking ? "true" : "false"}
          aria-describedby={message ? `${id}-message` : undefined}
          className={cn(
            "block w-full rounded-input border border-input bg-surface pl-9 py-2 pr-3 text-foreground",
            "placeholder-muted-foreground hover:border-foreground/40 focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            blocking
              ? "border-foreground border-b-2 border-b-highlight"
              : "",
          )}
        />
        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
          {statusIcon()}
        </div>
      </div>

      {error ? (
        <p className="caption flex items-center gap-1.5 text-highlight-ink animate-slide-down">
          <AlertCircle
            className="size-3.5 shrink-0"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          {error}
        </p>
      ) : message ? (
        <p
          id={`${id}-message`}
          role="status"
          aria-live="polite"
          className={cn(
            "caption flex items-center gap-1.5 animate-slide-down",
            isOk
              ? "text-foreground"
              : blocking
                ? "text-highlight-ink"
                : "text-muted-foreground",
          )}
        >
          {message}
        </p>
      ) : null}

      {blocking && suggestions.length > 0 ? (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onChange(suggestion)}
              className="caption rounded-md border border-border bg-surface-2 px-2.5 py-1 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              @{suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
