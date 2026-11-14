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

export const ROLES = ["admin", "viewer", "employee"] as const;

export type Role = (typeof ROLES)[number];

export const EMPLOYEE_ID_PREFIX = "EMP";
export const EMPLOYEE_COUNTER_ID = "employee";
export const AUTH_COOKIE_NAME = "ems_token";
export const DEFAULT_JWT_EXPIRES_IN = "7d";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;
export const USERNAME_CHECK_DEBOUNCE_MS = 500;
export const FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN = true;

export const RESERVED_USERNAMES = [
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "help",
  "api",
  "null",
  "undefined",
  "me",
  "account",
  "login",
  "logout",
  "employees",
  "dashboard",
  "hr",
  "staff",
  "owner",
  "superuser",
] as const;
