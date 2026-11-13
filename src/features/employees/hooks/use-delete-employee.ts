"use client";

import { useMutation } from "@tanstack/react-query";

import { deleteEmployee } from "@/features/employees/api";

/**
 * Pure delete mutation. Query invalidation is orchestrated by
 * DeleteConfirmDialog so the row can collapse first, then be unmounted
 * (plan: "collapseRow() then invalidate queries in onComplete").
 */
export function useDeleteEmployee() {
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
  });
}
