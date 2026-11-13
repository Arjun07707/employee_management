export const DEPARTMENTS = [
  "Engineering",
  "HR",
  "Finance",
  "Sales",
  "Marketing",
  "Operations",
  "Support",
  "Design",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export const EMPLOYEE_STATUSES = ["active", "inactive", "on_leave"] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const SORT_FIELDS = [
  "name",
  "email",
  "department",
  "salary",
  "joiningDate",
  "createdAt",
] as const;

export type SortField = (typeof SORT_FIELDS)[number];

export const SORT_ORDERS = ["asc", "desc"] as const;

export type SortOrder = (typeof SORT_ORDERS)[number];

export const PAGE_SIZES = [10, 25, 50] as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const MAX_EXPORT_ROWS = 10_000;
export const MAX_FUTURE_JOINING_DAYS = 30;

export const ROLES = ["admin", "viewer"] as const;

export type Role = (typeof ROLES)[number];

export const DEPARTMENT_COLORS: Record<Department, string> = {
  Engineering: "#5B5BD6",
  HR: "#14B8A6",
  Finance: "#F59E0B",
  Sales: "#EC4899",
  Marketing: "#3B82F6",
  Operations: "#8B5CF6",
  Support: "#22C55E",
  Design: "#F97316",
};

export const EMPLOYEE_ID_PREFIX = "EMP";
export const EMPLOYEE_COUNTER_ID = "employee";
export const AUTH_COOKIE_NAME = "ems_token";
export const DEFAULT_JWT_EXPIRES_IN = "7d";
