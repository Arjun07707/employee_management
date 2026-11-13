"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useDeleteEmployee } from "@/features/employees/hooks/use-delete-employee";
import { collapseRow } from "@/animations/presets";
import { dashboardKeys, employeeKeys } from "@/features/employees/query-keys";
import { ApiError } from "@/lib/api-client";
import type { Employee } from "@/shared/types/employee";

export interface DeleteConfirmDialogProps {
  employee: Employee | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful delete (e.g. navigate away from a detail page). */
  onDeleted?: (employee: Employee) => void;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function DeleteConfirmDialog({
  employee,
  open,
  onOpenChange,
  onDeleted,
}: DeleteConfirmDialogProps) {
  const queryClient = useQueryClient();
  const mutation = useDeleteEmployee();
  const submitting = mutation.isPending;

  // Reset the mutation when the dialog closes (event handler, not effect).
  const handleOpenChange = (next: boolean) => {
    if (!next) mutation.reset();
    onOpenChange(next);
  };

  const invalidateAll = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  }, [queryClient]);

  /**
   * Deletes first; on success the matching table row / card collapses
   * (collapseRow), and the queries are invalidated in the animation's
   * onComplete so React only unmounts the row after it has visually
   * collapsed (plan: "collapseRow() then invalidate queries in onComplete").
   */
  const onConfirm = () => {
    if (!employee || submitting) return;

    mutation.mutate(employee.id, {
      onSuccess: () => {
        const deleted = employee;
        handleOpenChange(false);

        toast.success(`${deleted.name} deleted`, {
          description: "The record was removed from the directory.",
        });
        onDeleted?.(deleted);

        const rows = Array.from(
          document.querySelectorAll<HTMLElement>(
            `[data-employee-id="${deleted.id}"]`,
          ),
        );

        // No row in the DOM (detail page) or reduced motion: invalidate now.
        if (rows.length === 0 || prefersReducedMotion()) {
          void invalidateAll();
          return;
        }

        let remaining = rows.length;
        for (const row of rows) {
          collapseRow(row, () => {
            remaining -= 1;
            if (remaining === 0) void invalidateAll();
          });
        }
      },
      onError: (error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : "Could not delete the employee",
        );
      },
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Delete employee?"
      description={
        employee
          ? `${employee.name} (${employee.employeeId}) will be removed from the directory. This action cannot be undone.`
          : "This action cannot be undone."
      }
      confirmLabel="Delete"
      destructive
      loading={submitting}
      onConfirm={onConfirm}
    />
  );
}
