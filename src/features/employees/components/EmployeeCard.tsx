"use client";

import * as React from "react";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";
import { cn } from "@/lib/utils";
import { formatDate, formatINR } from "@/lib/format";
import { DEPARTMENT_COLORS } from "@/shared/constants";
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

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      data-anim="card"
      data-employee-id={employee.id}
      onClick={() => onRowAction("view", employee)}
      className={cn(
        "cursor-pointer rounded-card border border-border bg-surface p-4 shadow-card",
        "transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-card-md",
      )}
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
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            onClick={(event) => event.stopPropagation()}
          >
            <DropdownMenuItem onSelect={() => onRowAction("view", employee)}>
              <Eye className="size-4" aria-hidden="true" />
              View
            </DropdownMenuItem>
            {canEdit ? (
              <>
                <DropdownMenuItem
                  onSelect={() => onRowAction("edit", employee)}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  destructive
                  onSelect={() => onRowAction("delete", employee)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium"
          style={{ color: DEPARTMENT_COLORS[employee.department] }}
        >
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full"
            style={{ backgroundColor: DEPARTMENT_COLORS[employee.department] }}
          />
          {employee.department}
        </span>
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
    </article>
  );
}
