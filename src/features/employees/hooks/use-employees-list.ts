"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { listEmployees } from "@/features/employees/api";
import { employeeKeys } from "@/features/employees/query-keys";
import type { EmployeeQuery } from "@/shared/schemas/employee.schema";

export function useEmployeesList(
  query: Partial<EmployeeQuery>,
  enabled = true,
) {
  return useQuery({
    queryKey: employeeKeys.list(query),
    queryFn: ({ signal }) => listEmployees(query, signal),
    enabled,
    // Keep the previous page visible while the next one loads; the caller
    // dims the table with `dimmed` instead of flashing skeletons.
    placeholderData: keepPreviousData,
  });
}
