"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { scaleIn, fadeUp } from "@/animations/presets";
import { Button } from "@/components/ui/button";

export function EmployeeNotFound() {
  const ref = React.useRef<HTMLDivElement>(null);

  useMotion(
    () => {
      const icon = ref.current?.querySelector("[data-anim='icon']");
      if (icon) scaleIn(icon);
      const texts = ref.current?.querySelectorAll("[data-anim='text']");
      if (texts && texts.length > 0) {
        fadeUp(Array.from(texts), { stagger: 0.06, delay: 0.1 });
      }
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center gap-4 rounded-card border border-border bg-surface px-6 py-20 text-center"
    >
      <span data-anim="icon" className="inline-flex text-muted-foreground">
        <SearchX className="size-16" strokeWidth={1.25} aria-hidden="true" />
      </span>

      <div data-anim="text" className="space-y-1">
        <p className="page-title text-foreground">
          Employee <em>not found</em>
          <span className="text-highlight">.</span>
        </p>
        <p className="text-sm text-muted-foreground">
          This record may have been deleted, or the link is incorrect.
        </p>
      </div>

      <Button asChild data-anim="text">
        <Link href="/employees">
          <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden="true" />
          Back to employees
        </Link>
      </Button>
    </div>
  );
}
