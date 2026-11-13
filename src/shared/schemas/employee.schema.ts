import { z } from "zod";

import {
  DEFAULT_PAGE_SIZE,
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  MAX_FUTURE_JOINING_DAYS,
  MAX_PAGE_SIZE,
  SORT_FIELDS,
  SORT_ORDERS,
} from "@/shared/constants";

const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;
const MAX_FUTURE_MS = MAX_FUTURE_JOINING_DAYS * 86_400_000;

export const phoneSchema = z
  .string()
  .trim()
  .regex(PHONE_REGEX, "Invalid phone number");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email format")
  .max(254, "Email must be at most 254 characters");

export const joiningDateSchema = z
  .union([z.date(), z.string().trim().min(1, "Joining date is required")])
  .transform((value) => (value instanceof Date ? value : new Date(value)))
  .refine((date) => !Number.isNaN(date.getTime()), {
    message: "Invalid joining date",
  })
  .refine((date) => date.getTime() <= Date.now() + MAX_FUTURE_MS, {
    message: `Joining date cannot be more than ${MAX_FUTURE_JOINING_DAYS} days in the future`,
  });

export const employeeFields = {
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: emailSchema,
  phone: phoneSchema,
  department: z.enum(DEPARTMENTS, {
    message: "Please select a valid department",
  }),
  designation: z
    .string()
    .trim()
    .min(2, "Designation must be at least 2 characters")
    .max(100, "Designation must be at most 100 characters"),
  salary: z.coerce
    .number({ message: "Salary must be a number" })
    .min(0, "Salary cannot be negative")
    .max(100_000_000, "Salary cannot exceed 10,00,00,000"),
  joiningDate: joiningDateSchema,
  status: z.enum(EMPLOYEE_STATUSES, {
    message: "Please select a valid status",
  }),
} as const;

export const createEmployeeSchema = z
  .object({
    ...employeeFields,
    status: employeeFields.status.default("active"),
  })
  .strict();

export const updateEmployeeSchema = z
  .object(employeeFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const employeeQuerySchema = z
  .object({
    search: z
      .string()
      .trim()
      .max(100, "Search must be at most 100 characters")
      .optional()
      .transform((value) => (value ? value : undefined)),
    department: z.enum(DEPARTMENTS).optional(),
    status: z.enum(EMPLOYEE_STATUSES).optional(),
    sortBy: z.enum(SORT_FIELDS).default("createdAt"),
    order: z.enum(SORT_ORDERS).default("desc"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(MAX_PAGE_SIZE, `Limit cannot exceed ${MAX_PAGE_SIZE}`)
      .default(DEFAULT_PAGE_SIZE),
  })
  .strict();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
