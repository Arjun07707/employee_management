"use client";

import { useQuery } from "@tanstack/react-query";

import { getDashboardStats } from "@/features/dashboard/api";
import { dashboardKeys } from "@/features/employees/query-keys";

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: getDashboardStats,
  });
}
