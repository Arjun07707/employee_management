"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";
import { gsap } from "@/animations/gsap";
import { formatDate, formatINR } from "@/lib/format";
import type { Employee } from "@/shared/types/employee";
import { Avatar } from "@/components/common/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/features/employees/components/StatusBadge";
import { DepartmentBadge } from "@/features/employees/components/DepartmentBadge";

export interface EmployeeCardProps {
  employee: Employee;
  onRowAction: (action: "view" | "edit" | "delete", employee: Employee) => void;
  canEdit: boolean;
  reanimateKey?: unknown;
}

/** Mobile (<1024px) stacked list item for one employee. */
export function EmployeeCard({
  employee,
  onRowAction,
  canEdit,
  reanimateKey,
}: EmployeeCardProps) {
  const ref = React.useRef<HTMLElement>(null);

  useMotion(
    () => {
      fadeUp(ref.current, { y: 10, duration: 0.3 });
    },
    { scope: ref, dependencies: [reanimateKey] },
  );

  // Underline wipe on hover (replaces the old lift + glow).
  useMotion(
    ({ contextSafe }) => {
      const el = ref.current;
      const underline = el?.querySelector<HTMLElement>(
        "[data-anim='underline']",
      );
      if (!el || !underline) return;

      const onEnter = contextSafe(() => {
        gsap.to(underline, { scaleX: 1, duration: 0.35, ease: "power3.out" });
      });
      const onLeave = contextSafe(() => {
        gsap.to(underline, {
          transformOrigin: "right",
          scaleX: 0,
          duration: 0.35,
          ease: "power3.out",
        });
      });

      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
      return () => {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: ref },
  );

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      data-anim="card"
      data-employee-id={employee.id}
      onClick={() => onRowAction("view", employee)}
      className="relative cursor-pointer overflow-hidden rounded-card border border-border bg-surface p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={employee.name} size="md" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">
              {employee.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {employee.email}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${employee.name}`}
              onClick={(event) => event.stopPropagation()}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <MoreHorizontal
                className="size-4"
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem onSelect={() => onRowAction("view", employee)}>
              <Eye className="size-4" strokeWidth={1.5} aria-hidden="true" />
              View
            </DropdownMenuItem>
            {canEdit ? (
              <>
                <DropdownMenuItem
                  onSelect={() => onRowAction("edit", employee)}
                >
                  <Pencil
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  destructive
                  onSelect={() => onRowAction("delete", employee)}
                >
                  <Trash2
                    className="size-4"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DepartmentBadge department={employee.department} />
        <StatusBadge status={employee.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Designation</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {employee.designation}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Salary</dt>
          <dd className="mt-0.5 font-medium tabular-nums text-foreground">
            {formatINR(employee.salary)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Joined</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {formatDate(employee.joiningDate)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Employee ID</dt>
          <dd className="mt-0.5 font-mono text-foreground">
            {employee.employeeId}
          </dd>
        </div>
      </dl>

      <span
        data-anim="underline"
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-foreground"
      />
    </article>
  );
}
