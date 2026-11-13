"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";
import { AnimatedProgress } from "@/components/motion/AnimatedProgress";
import { CountUp } from "@/components/motion/CountUp";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DEPARTMENT_COLORS } from "@/shared/constants";
import type { DepartmentStat } from "@/shared/types/employee";
import { formatINR } from "@/lib/format";

export function DepartmentBreakdown({ data }: { data: DepartmentStat[] }) {
  const router = useRouter();
  const listRef = React.useRef<HTMLOListElement>(null);

  const total = data.reduce((sum, item) => sum + item.count, 0);

  useMotion(
    () => {
      fadeUp(
        listRef.current?.children ? Array.from(listRef.current.children) : [],
        {
          stagger: 0.06,
          delay: 0.2,
        },
      );
    },
    { scope: listRef },
  );

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Department breakdown</CardTitle>
          <CardDescription>
            {total} employee{total === 1 ? "" : "s"} across {data.length}{" "}
            departments
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ol ref={listRef} className="space-y-4">
          {data.map((item) => {
            const pct = total === 0 ? 0 : (item.count / total) * 100;
            const color = DEPARTMENT_COLORS[item.department];

            return (
              <li key={item.department}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/employees?department=${encodeURIComponent(item.department)}`,
                    )
                  }
                  className="group block w-full rounded-md p-1 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {item.department}
                    </span>
                    <span className="caption text-muted-foreground">
                      Avg {formatINR(item.avgSalary)}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <AnimatedProgress value={pct} color={color} />
                    <span className="w-8 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                      <CountUp value={item.count} />
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </CardContent>

      <div className="border-t border-border px-5 py-3">
        <Link
          href="/employees"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View all employees →
        </Link>
      </div>
    </Card>
  );
}
