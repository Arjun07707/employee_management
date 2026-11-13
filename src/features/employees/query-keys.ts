import type { EmployeeQuery } from "@/shared/schemas/employee.schema";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (params: Partial<EmployeeQuery>) =>
    ["employees", "list", params] as const,
  detail: (id: string) => ["employees", "detail", id] as const,
};

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => ["dashboard", "stats"] as const,
};
