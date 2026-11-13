"use client";

import { useQuery } from "@tanstack/react-query";

import { getEmployee } from "@/features/employees/api";
import { employeeKeys } from "@/features/employees/query-keys";

export function useEmployee(id: string, enabled = true) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: ({ signal }) => getEmployee(id, signal),
    enabled: enabled && Boolean(id),
  });
}
