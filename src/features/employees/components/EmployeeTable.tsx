"use client";

import * as React from "react";
import { ChevronDown, Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { useMotion } from "@/animations/use-motion";
import { fadeUp } from "@/animations/presets";
import { Flip } from "@/animations/gsap";
import { cn } from "@/lib/utils";
import { formatDate, formatINR } from "@/lib/format";
import type { SortField } from "@/shared/constants";
import type { Employee } from "@/shared/types/employee";
import { Avatar } from "@/components/common/Avatar";
import { DepartmentBadge } from "@/features/employees/components/DepartmentBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/features/employees/components/StatusBadge";

export interface EmployeeTableProps {
  employees: Employee[];
  sortBy: SortField;
  order: "asc" | "desc";
  onSort: (field: SortField) => void;
  onRowAction: (action: "view" | "edit" | "delete", employee: Employee) => void;
  canEdit: boolean;
  /** Key that should re-trigger the row entrance animation. */
  reanimateKey?: unknown;
  dimmed?: boolean;
}

function SortHeader({
  field,
  label,
  sortBy,
  order,
  onSort,
  className,
}: {
  field: SortField;
  label: string;
  sortBy: SortField;
  order: "asc" | "desc";
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const active = sortBy === field;
  const orderRef = React.useRef<"asc" | "desc">(order);
  const chevronRef = React.useRef<SVGSVGElement>(null);

  // Chevron flip when this column's sort direction changes. The ref is on the
  // actual chevron element (Flip.getState needs a rendered target).
  React.useLayoutEffect(() => {
    const el = chevronRef.current;
    if (!el) return;
    if (orderRef.current !== order) {
      const state = Flip.getState(el);
      orderRef.current = order;
      Flip.from(state, { duration: 0.25, ease: "power2.out" });
    }
  }, [order, active]);

  return (
    <TableHead
      aria-sort={
        active ? (order === "asc" ? "ascending" : "descending") : "none"
      }
      className={cn("p-0", className)}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "flex h-12 w-full items-center gap-1.5 px-4 text-left text-[11px] font-medium uppercase leading-4 tracking-[0.08em] transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {label}
        <ChevronDown
          ref={chevronRef}
          aria-hidden="true"
          strokeWidth={1.5}
          className={cn(
            "size-4 transition-transform duration-250",
            active ? "text-highlight opacity-100" : "opacity-35",
            active && order === "asc" && "rotate-180",
          )}
        />
      </button>
    </TableHead>
  );
}

export function EmployeeTable({
  employees,
  sortBy,
  order,
  onSort,
  onRowAction,
  canEdit,
  reanimateKey,
  dimmed = false,
}: EmployeeTableProps) {
  const bodyRef = React.useRef<HTMLTableSectionElement>(null);

  // Row entrance on page/filter/sort change only (never on refetch).
  useMotion(
    () => {
      const rows = bodyRef.current?.querySelectorAll("tr[data-anim='row']");
      if (rows && rows.length > 0) {
        fadeUp(Array.from(rows).slice(0, 15), {
          y: 10,
          stagger: 0.03,
          duration: 0.3,
        });
      }
    },
    { scope: bodyRef, dependencies: [reanimateKey] },
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-border bg-surface transition-opacity duration-200",
        dimmed && "opacity-60",
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <SortHeader
              field="name"
              label="Employee"
              sortBy={sortBy}
              order={order}
              onSort={onSort}
            />
            <TableHead>Employee ID</TableHead>
            <SortHeader
              field="department"
              label="Department"
              sortBy={sortBy}
              order={order}
              onSort={onSort}
            />
            <TableHead>Designation</TableHead>
            <SortHeader
              field="salary"
              label="Salary"
              sortBy={sortBy}
              order={order}
              onSort={onSort}
              className="text-right"
            />
            <SortHeader
              field="joiningDate"
              label="Joined"
              sortBy={sortBy}
              order={order}
              onSort={onSort}
            />
            <TableHead>Status</TableHead>
            <TableHead className="w-12 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody ref={bodyRef}>
          {employees.map((employee) => (
            <TableRow
              key={employee.id}
              data-anim="row"
              data-employee-id={employee.id}
              className="cursor-pointer"
              onClick={() => onRowAction("view", employee)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={employee.name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {employee.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {employee.email}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell>
                <span className="font-mono text-xs text-muted-foreground">
                  {employee.employeeId}
                </span>
              </TableCell>

              <TableCell>
                <DepartmentBadge department={employee.department} />
              </TableCell>

              <TableCell className="text-muted-foreground">
                {employee.designation}
              </TableCell>

              <TableCell className="text-right font-medium tabular-nums text-foreground">
                {formatINR(employee.salary)}
              </TableCell>

              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(employee.joiningDate)}
              </TableCell>

              <TableCell>
                <StatusBadge status={employee.status} />
              </TableCell>

              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Actions for ${employee.name}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <DropdownMenuItem
                      onSelect={() => onRowAction("view", employee)}
                    >
                      <Eye
                        className="size-4"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
