"use client";

import * as React from "react";
import { X } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { scaleIn, DUR, EASE } from "@/animations/presets";
import { gsap } from "@/animations/gsap";
import { DEPARTMENT_COLORS } from "@/shared/constants";
import { STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
  color?: string;
}

export interface FilterChipsProps {
  search?: string;
  department?: string;
  status?: string;
  onRemoveSearch: () => void;
  onRemoveDepartment: () => void;
  onRemoveStatus: () => void;
  className?: string;
}

/** Animated row of active filter chips; each chip scales in on mount. */
export function FilterChips({
  search,
  department,
  status,
  onRemoveSearch,
  onRemoveDepartment,
  onRemoveStatus,
  className,
}: FilterChipsProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  const chips: Chip[] = React.useMemo(() => {
    const list: Chip[] = [];
    if (search) {
      list.push({
        key: "search",
        label: `Search: “${search}”`,
        onRemove: onRemoveSearch,
      });
    }
    if (department) {
      list.push({
        key: "department",
        label: department,
        onRemove: onRemoveDepartment,
        color: DEPARTMENT_COLORS[department as keyof typeof DEPARTMENT_COLORS],
      });
    }
    if (status) {
      list.push({
        key: "status",
        label: STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? status,
        onRemove: onRemoveStatus,
      });
    }
    return list;
  }, [
    search,
    department,
    status,
    onRemoveSearch,
    onRemoveDepartment,
    onRemoveStatus,
  ]);

  useMotion(
    ({ contextSafe }) => {
      const items = ref.current?.querySelectorAll("[data-chip]");
      if (items && items.length > 0) {
        scaleIn(items, { stagger: 0.05 });
      }

      // Chip removal: scale down + fade out, then let the state update remove
      // it from the DOM (contextSafe keeps GSAP references scoped to this tree).
      const remove = contextSafe((chip: Chip, el: HTMLElement) => {
        gsap.to(el, {
          scale: 0.8,
          autoAlpha: 0,
          duration: DUR.fast,
          ease: EASE.snappy,
          onComplete: () => chip.onRemove(),
        });
      });

      const onClick = (event: MouseEvent) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>(
          "[data-chip-remove]",
        );
        if (!target) return;
        const el = target.closest<HTMLElement>("[data-chip]");
        const key = el?.getAttribute("data-chip");
        const chip = chips.find((item) => item.key === key);
        if (chip && el) remove(chip, el);
      };

      const scope = ref.current;
      scope?.addEventListener("click", onClick);
      return () => scope?.removeEventListener("click", onClick);
    },
    { scope: ref, dependencies: [chips.map((chip) => chip.key).join(",")] },
  );

  if (chips.length === 0) return null;

  return (
    <div
      ref={ref}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          data-chip
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1 pl-3 pr-1.5 text-xs font-medium text-foreground"
        >
          {chip.color ? (
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full"
              style={{ backgroundColor: chip.color }}
            />
          ) : null}
          {chip.label}
          <button
            type="button"
            data-chip-remove
            aria-label={`Remove ${chip.label} filter`}
            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </span>
      ))}
    </div>
  );
}
