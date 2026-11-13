"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createEmployee } from "@/features/employees/api";
import { employeeKeys, dashboardKeys } from "@/features/employees/query-keys";
import type { CreateEmployeeInput } from "@/shared/schemas/employee.schema";

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmployeeInput) => createEmployee(input),
    onSuccess: async (employee) => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      toast.success(`${employee.name} added`, {
        description: `${employee.employeeId} · ${employee.department}`,
      });
    },
  });
}
