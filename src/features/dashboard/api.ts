import { apiFetch } from "@/lib/api-client";
import type { DashboardStats } from "@/shared/types/employee";

export function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/api/dashboard/stats");
}
