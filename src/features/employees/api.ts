import { apiFetch, apiFetchPaginated } from "@/lib/api-client";
import type { Pagination } from "@/shared/types/api";
import type { Employee } from "@/shared/types/employee";
import type { EmployeeQuery } from "@/shared/schemas/employee.schema";

function toSearchParams(query: Partial<EmployeeQuery>): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  return params;
}

export interface EmployeeListResult {
  data: Employee[];
  pagination: Pagination;
}

export function listEmployees(
  query: Partial<EmployeeQuery>,
  signal?: AbortSignal,
): Promise<EmployeeListResult> {
  const params = toSearchParams(query);
  return apiFetchPaginated<Employee>(
    `/api/employees?${params.toString()}`,
    signal ? { signal } : {},
  );
}

export function getEmployee(
  id: string,
  signal?: AbortSignal,
): Promise<Employee> {
  return apiFetch<Employee>(`/api/employees/${id}`, signal ? { signal } : {});
}

export function createEmployee(input: unknown): Promise<Employee> {
  return apiFetch<Employee>("/api/employees", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateEmployee(id: string, input: unknown): Promise<Employee> {
  return apiFetch<Employee>(`/api/employees/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteEmployee(id: string): Promise<void> {
  return apiFetch<null>(`/api/employees/${id}`, { method: "DELETE" }).then(
    () => undefined,
  );
}

/** Direct download link for the CSV export (uses the current filters). */
export function exportUrl(query: Partial<EmployeeQuery>): string {
  const params = toSearchParams(query);
  const qs = params.toString();
  return `/api/employees/export${qs ? `?${qs}` : ""}`;
}
