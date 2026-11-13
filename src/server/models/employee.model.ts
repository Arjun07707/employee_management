import "server-only";

import {
  model,
  models,
  Schema,
  type InferSchemaType,
  type Model,
} from "mongoose";

import {
  DEPARTMENTS,
  EMPLOYEE_STATUSES,
  MAX_FUTURE_JOINING_DAYS,
} from "@/shared/constants";

const MAX_FUTURE_MS = MAX_FUTURE_JOINING_DAYS * 86_400_000;
const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;

const employeeSchema = new Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [PHONE_REGEX, "Invalid phone number"],
    },
    department: {
      type: String,
      required: true,
      enum: DEPARTMENTS,
    },
    designation: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
      max: 100_000_000,
    },
    joiningDate: {
      type: Date,
      required: true,
      validate: {
        validator: (value: Date) =>
          value.getTime() <= Date.now() + MAX_FUTURE_MS,
        message: `Joining date cannot be more than ${MAX_FUTURE_JOINING_DAYS} days in the future`,
      },
    },
    status: {
      type: String,
      enum: EMPLOYEE_STATUSES,
      default: "active",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, versionKey: false },
);

const activeOnly = { partialFilterExpression: { isDeleted: false } };

// A soft-deleted email becomes available again for a new employee.
employeeSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { isDeleted: false },
    name: "uniq_email_active",
  },
);

employeeSchema.index({ createdAt: -1 }, { ...activeOnly, name: "idx_created" });
employeeSchema.index(
  { department: 1, createdAt: -1 },
  { ...activeOnly, name: "idx_dept_created" },
);
employeeSchema.index(
  { status: 1, createdAt: -1 },
  { ...activeOnly, name: "idx_status_created" },
);
employeeSchema.index({ name: 1 }, { ...activeOnly, name: "idx_name" });
employeeSchema.index(
  { joiningDate: -1 },
  { ...activeOnly, name: "idx_joining" },
);
employeeSchema.index({ salary: 1 }, { ...activeOnly, name: "idx_salary" });

export type EmployeeDoc = InferSchemaType<typeof employeeSchema>;

export const Employee: Model<EmployeeDoc> =
  (models.Employee as Model<EmployeeDoc> | undefined) ??
  model<EmployeeDoc>("Employee", employeeSchema);
