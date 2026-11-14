"use client";

import * as React from "react";

import { useMotion } from "@/animations/use-motion";
import { scaleIn } from "@/animations/presets";
import { CountUp } from "@/components/motion/CountUp";
import { gsap } from "@/animations/gsap";

export type StatTone = "primary" | "success" | "warning" | "accent";

type IconComponent = React.ComponentType<{
  className?: string;
  strokeWidth?: number;
}>;

export interface StatCardProps {
  label: string;
  value: number;
  icon: IconComponent;
  tone: StatTone;
  caption?: string;
  loading?: boolean;
  /** Grid position, rendered as a two-digit mono index ("01 / Total"). */
  index?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  caption,
  loading = false,
  index,
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

  const digitCount = String(value).length;

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      data-anim="stat-card"
      className="rounded-card border border-border bg-surface p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="eyebrow text-muted-foreground">
          {index != null ? (
            <>
              <span className="font-mono">
                {String(index).padStart(2, "0")}
              </span>
              {" / "}
              {label}
            </>
          ) : (
            label
          )}
        </p>
        <span data-anim="chip" className="inline-flex text-muted-foreground">
          <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="stat-number text-foreground">
          {loading ? (
            "—"
          ) : (
            <span
              className="inline-block"
              style={{ minWidth: `${digitCount}ch` }}
            >
              <CountUp value={value} />
            </span>
          )}
        </p>

        {caption && !loading ? (
          <p className="caption mt-2 text-muted-foreground">{caption}</p>
        ) : null}
      </div>
    </article>
  );
}
