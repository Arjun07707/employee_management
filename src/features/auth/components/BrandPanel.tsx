"use client";

import * as React from "react";
import { Sparkles, Shield, Zap } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { gsap } from "@/animations/gsap";
import { fadeUp, STAGGER } from "@/animations/presets";
import { cn } from "@/lib/utils";

export interface BrandPanelProps {
  className?: string;
}

const BULLETS = [
  {
    icon: "sparkles",
    text: "Live headcount, departments and salaries at a glance",
  },
  {
    icon: "shield",
    text: "Role-based access with admin and viewer permissions",
  },
  { icon: "zap", text: "Search, filter and export your team in seconds" },
] as const;

const ICONS = {
  sparkles: Sparkles,
  shield: Shield,
  zap: Zap,
} as const;

const RING_DURATIONS = [60, 90, 120] as const;

const PAPER_GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

/** Black editorial panel shown beside the login card on desktop. */
export function BrandPanel({ className }: BrandPanelProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useMotion(
    ({ contextSafe }) => {
      const root = ref.current;
      if (!root) return;

      // Concentric rings rotate forever at different speeds; the middle ring
      // carries the orbiting highlight dot.
      const rings = root.querySelectorAll<HTMLElement>("[data-anim='ring']");
      rings.forEach((ring, index) => {
        gsap.to(ring, {
          rotation: 360,
          duration: RING_DURATIONS[index] ?? 90,
          ease: "none",
          repeat: -1,
        });
      });

      // Headline words stagger up.
      const words = root.querySelectorAll<HTMLElement>("[data-anim='word']");
      fadeUp(words, { stagger: 0.05, delay: 0.15 });

      // Bullets.
      fadeUp(root.querySelectorAll("[data-anim='bullet']"), {
        stagger: STAGGER.base,
        delay: 0.45,
      });

      // Cleanup happens automatically with useGSAP; contextSafe keeps the
      // infinite tweens tied to the scope.
      void contextSafe;
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "relative hidden flex-1 overflow-hidden bg-[#0A0A0A] p-12 text-white lg:flex lg:flex-col lg:justify-between",
        className,
      )}
    >
      {/* Paper grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-screen"
        style={{ backgroundImage: PAPER_GRAIN }}
      />

      {/* Concentric rings */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2">
          <div
            data-anim="ring"
            className="size-full rounded-full border border-white/8"
          />
        </div>
        <div className="absolute left-1/2 top-1/2 size-[640px] -translate-x-1/2 -translate-y-1/2">
          <div
            data-anim="ring"
            className="relative size-full rounded-full border border-white/8"
          >
            <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-highlight" />
          </div>
        </div>
        <div className="absolute left-1/2 top-1/2 size-[860px] -translate-x-1/2 -translate-y-1/2">
          <div
            data-anim="ring"
            className="size-full rounded-full border border-white/8"
          />
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2.5">
        <span className="font-display text-xl tracking-tight text-white">
          Employee Management
        </span>
        <span className="size-1.5 rounded-full bg-highlight" />
      </div>

      <div className="relative z-10 max-w-md">
        <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
          <span data-anim="word" className="inline-block">
            Manage
          </span>{" "}
          <span data-anim="word" className="inline-block">
            your
          </span>{" "}
          <span data-anim="word" className="inline-block">
            people,
          </span>{" "}
          <span data-anim="word" className="inline-block">
            <em>effortlessly.</em>
          </span>
        </h1>

        <ul className="mt-8 space-y-4">
          {BULLETS.map((bullet) => {
            const Icon = ICONS[bullet.icon];
            return (
              <li
                key={bullet.text}
                data-anim="bullet"
                className="flex items-start gap-3"
              >
                <Icon
                  className="mt-0.5 size-[18px] shrink-0 text-white/70"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <span className="text-sm leading-6 text-white/70">
                  {bullet.text}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="relative z-10 text-xs text-white/55">
        © 2026 Employee Management
      </div>
    </div>
  );
}
