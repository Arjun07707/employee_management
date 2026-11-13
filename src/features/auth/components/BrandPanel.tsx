"use client";

import * as React from "react";

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

/** Decorative gradient panel shown beside the login card on desktop. */
export function BrandPanel({ className }: BrandPanelProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  useMotion(
    ({ contextSafe }) => {
      const root = ref.current;
      if (!root) return;

      // Floating gradient blobs (infinite yoyo).
      const blobs = root.querySelectorAll<HTMLElement>("[data-anim='blob']");
      blobs.forEach((blob, index) => {
        gsap.to(blob, {
          y: index % 2 === 0 ? -32 : 28,
          x: index % 2 === 0 ? 18 : -22,
          duration: 6 + index * 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
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
        "relative hidden flex-1 overflow-hidden brand-gradient p-12 text-white lg:flex lg:flex-col lg:justify-between",
        className,
      )}
    >
      {/* Floating blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          data-anim="blob"
          className="absolute -left-16 top-10 size-72 rounded-full bg-white/15 blur-2xl animate-blob"
        />
        <div
          data-anim="blob"
          className="absolute right-0 top-1/3 size-96 rounded-full bg-white/10 blur-3xl animate-blob"
        />
        <div
          data-anim="blob"
          className="absolute -bottom-20 left-1/3 size-80 rounded-full bg-white/10 blur-3xl animate-blob"
        />
      </div>

      <div className="relative z-10 flex items-center gap-3">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect width="40" height="40" rx="12" fill="rgba(255,255,255,0.18)" />
          <path
            d="M13 12.5h14M13 20h10M13 27.5h14"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-lg font-bold tracking-tight">
          Employee Management
        </span>
      </div>

      <div className="relative z-10 max-w-md">
        <h1 className="text-4xl font-bold leading-tight tracking-tight">
          <span data-anim="word" className="inline-block">
            Manage
          </span>{" "}
          <span data-anim="word" className="inline-block">
            your
          </span>{" "}
          <span data-anim="word" className="inline-block">
            people,
          </span>{" "}
          <span data-anim="word" className="inline-block italic">
            effortlessly.
          </span>
        </h1>
      </div>

      <ul className="relative z-10 space-y-4">
        {BULLETS.map((bullet) => (
          <li
            key={bullet.text}
            data-anim="bullet"
            className="flex items-start gap-3"
          >
            <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20">
              <svg
                className="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span className="text-sm text-white/90">{bullet.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
