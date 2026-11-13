"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { scaleIn } from "@/animations/presets";
import { CountUp } from "@/components/motion/CountUp";
import { gsap } from "@/animations/gsap";
import { cn } from "@/lib/utils";

export type StatTone = "primary" | "success" | "warning" | "accent";

type IconComponent = React.ComponentType<{ className?: string }>;

const TONES: Record<StatTone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  accent: "bg-accent-soft text-accent",
};

export interface StatCardProps {
  label: string;
  value: number;
  icon: IconComponent;
  tone: StatTone;
  caption?: string;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  caption,
  loading = false,
}: StatCardProps) {
  const ref = React.useRef<HTMLElement>(null);

  useMotion(
    ({ contextSafe }) => {
      const el = ref.current;
      if (!el) return;

      // Entrance: fade up + icon chip scale in.
      gsap.from(el, {
        autoAlpha: 0,
        y: 16,
        duration: 0.4,
        ease: "power3.out",
        clearProps: "transform",
      });
      scaleIn(el.querySelector("[data-anim='chip']"), {
        duration: 0.5,
        delay: 0.15,
      });

      // Hover lift via contextSafe so it is cleaned up.
      const enter = contextSafe(() =>
        gsap.to(el, { y: -4, duration: 0.25, ease: "power2.out" }),
      );
      const leave = contextSafe(() =>
        gsap.to(el, { y: 0, duration: 0.25, ease: "power2.out" }),
      );

      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);

      return () => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      };
    },
    { scope: ref },
  );

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      data-anim="stat-card"
      className="rounded-card border border-border bg-surface p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-4">
        <span
          data-anim="chip"
          className={cn(
            "inline-flex size-11 items-center justify-center rounded-input",
            TONES[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>

      <p className="stat-number mt-4 text-foreground">
        {loading ? "—" : <CountUp value={value} />}
      </p>

      <p className="mt-1 text-sm font-medium text-muted-foreground">{label}</p>

      {caption && !loading ? (
        <p className="caption mt-2 text-muted-foreground">{caption}</p>
      ) : null}
    </article>
  );
}
