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
import { DEPARTMENT_COLORS } from "@/shared/constants";
import { formatDate } from "@/lib/format";
import type { Employee } from "@/shared/types/employee";

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

                <span
                  className="hidden items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium sm:inline-flex"
                  style={{ color: DEPARTMENT_COLORS[employee.department] }}
                >
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor: DEPARTMENT_COLORS[employee.department],
                    }}
                  />
                  {employee.department}
                </span>

                <StatusBadge status={employee.status} />

                <span className="hidden w-24 shrink-0 text-right text-xs text-muted-foreground lg:block">
                  {formatDate(employee.joiningDate)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
