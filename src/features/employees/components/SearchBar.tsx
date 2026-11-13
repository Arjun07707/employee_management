"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

import { useMotion } from "@/animations/use-motion";
import { EASE, DUR } from "@/animations/presets";
import { gsap } from "@/animations/gsap";
import { cn } from "@/lib/utils";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Debounce in ms before emitting onChange. */
  debounceMs?: number;
  className?: string;
}

/**
 * Controlled search input with an internal `use-debounce` emission, a clear
 * button, focus width growth (280 -> 360px) and a "/" keyboard shortcut.
 */
export function SearchBar({
  value,
  onChange,
  debounceMs = 400,
  className,
}: SearchBarProps) {
  const [internal, setInternal] = React.useState(value);
  const [prevValue, setPrevValue] = React.useState(value);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  // Keep external changes (e.g. clear filters) in sync. Adjusting state during
  // render avoids the cascading render a setState-in-effect would cause.
  if (value !== prevValue) {
    setPrevValue(value);
    setInternal(value);
  }

  const debouncedOnChange = useDebouncedCallback((next: string) => {
    onChange(next);
  }, debounceMs);

  // An external value change supersedes anything still waiting to emit.
  React.useEffect(() => {
    debouncedOnChange.cancel();
  }, [value, debouncedOnChange]);

  const handleChange = (next: string) => {
    setInternal(next);
    debouncedOnChange(next);
  };

  const clear = () => {
    debouncedOnChange.cancel();
    setInternal("");
    onChange("");
    inputRef.current?.focus();
  };

  // "/" focuses the search (unless typing in another field).
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Focus: container width grows 280 -> 360px.
  useMotion(
    () => {
      const el = wrapRef.current;
      if (!el) return;

      const onFocus = () =>
        gsap.to(el, { width: 360, duration: DUR.fast, ease: EASE.snappy });
      const onBlur = () =>
        gsap.to(el, { width: 280, duration: DUR.fast, ease: EASE.snappy });

      const input = inputRef.current;
      input?.addEventListener("focus", onFocus);
      input?.addEventListener("blur", onBlur);

      return () => {
        input?.removeEventListener("focus", onFocus);
        input?.removeEventListener("blur", onBlur);
      };
    },
    { scope: wrapRef },
  );

  return (
    <div
      ref={wrapRef}
      style={{ width: 280 }}
      className={cn("relative max-w-full", className)}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        ref={inputRef}
        type="search"
        value={internal}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Search employees…"
        aria-label="Search employees"
        className={cn(
          "h-10 w-full rounded-input border border-border bg-surface-2 pl-9 pr-9 text-sm text-foreground",
          "placeholder:text-muted-foreground/70",
          "transition-[border-color,background-color] duration-200",
          "focus:border-primary focus:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "[&::-webkit-search-cancel-button]:hidden",
        )}
      />
      {internal ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
