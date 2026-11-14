"use client";

import * as React from "react";
import Link from "next/link";

import { useMotion } from "@/animations/use-motion";
import { slideInX, scaleIn } from "@/animations/presets";
import { Avatar } from "@/components/common/Avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { StatusBadge } from "@/features/employees/components/StatusBadge";
import type { Employee } from "@/shared/types/employee";

function formatRelativeDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000);

  if (Math.abs(days) < 30) return rtf.format(days, "day");
  if (Math.abs(days) < 365) return rtf.format(Math.round(days / 30), "month");
  return rtf.format(Math.round(days / 365), "year");
}

export function RecentEmployees({ employees }: { employees: Employee[] }) {
  const listRef = React.useRef<HTMLOListElement>(null);

  useMotion(
    () => {
      const rows = listRef.current?.querySelectorAll(
        "[data-anim='recent-row']",
      );
      if (rows && rows.length > 0) {
        slideInX(Array.from(rows), 24, { stagger: 0.07 });
      }
      scaleIn(listRef.current?.querySelectorAll("[data-anim='avatar']") ?? [], {
        stagger: 0.07,
        delay: 0.15,
      });
    },
    { scope: listRef },
  );

  if (employees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent employees</CardTitle>
            <CardDescription>The newest members of your team</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No employees yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent employees</CardTitle>
          <CardDescription>The newest members of your team</CardDescription>
        </div>
        <Link
          href="/employees"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          View all
        </Link>
      </CardHeader>

      <CardContent>
        <ol ref={listRef} className="divide-y divide-border">
          {employees.map((employee) => (
            <li key={employee.id} data-anim="recent-row">
              <Link
                href={`/employees/${employee.id}`}
                className="flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span data-anim="avatar">
                  <Avatar name={employee.name} size="sm" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {employee.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {employee.designation}
                  </p>
                </div>

                <span className="hidden items-center rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground sm:inline-flex">
                  {employee.department}
                </span>

                <StatusBadge status={employee.status} />

                <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground lg:block">
                  {formatRelativeDate(employee.joiningDate)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
