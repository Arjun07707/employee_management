import "server-only";

import type { Department, EmployeeStatus } from "@/shared/constants";
import type { Employee } from "@/shared/types/employee";

export interface EmployeeDTOInput {
  _id: unknown;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  salary: number;
  joiningDate: Date | string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

/**
 * `.lean()` bypasses Mongoose toJSON transforms, so every service result
 * must be mapped through this function before it reaches an API response.
 */
export function toEmployeeDTO(document: EmployeeDTOInput): Employee {
  return {
    id: String(document._id),
    employeeId: document.employeeId,
    name: document.name,
    email: document.email,
    phone: document.phone,
    department: document.department as Department,
    designation: document.designation,
    salary: document.salary,
    joiningDate: toIso(document.joiningDate),
    status: document.status as EmployeeStatus,
    createdAt: toIso(document.createdAt),
    updatedAt: toIso(document.updatedAt),
  };
}
