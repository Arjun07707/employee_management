"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateEmployee } from "@/features/employees/api";
import { employeeKeys, dashboardKeys } from "@/features/employees/query-keys";
import type { UpdateEmployeeInput } from "@/shared/schemas/employee.schema";

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEmployeeInput) => updateEmployee(id, input),
    onSuccess: async (employee) => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      await queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.setQueryData(employeeKeys.detail(id), employee);
      toast.success(`${employee.name} updated`);
    },
  });
}
