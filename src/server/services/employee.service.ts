import "server-only";

import mongoose, { type QueryFilter } from "mongoose";

import {
  EMPLOYEE_COUNTER_ID,
  EMPLOYEE_ID_PREFIX,
  MAX_EXPORT_ROWS,
} from "@/shared/constants";
import type {
  CreateEmployeeInput,
  EmployeeQuery,
  UpdateEmployeeInput,
} from "@/shared/schemas/employee.schema";
import type { Pagination } from "@/shared/types/api";
import type { Employee as EmployeeDTO } from "@/shared/types/employee";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/http/errors";
import { Counter } from "@/server/models/counter.model";
import { Employee, type EmployeeDoc } from "@/server/models/employee.model";
import { escapeRegex } from "@/server/security/escape-regex";
import { buildCsv } from "@/server/utils/csv";
import { toEmployeeDTO, type EmployeeDTOInput } from "@/server/utils/dto";
import { User } from "@/server/models/user.model";

const SORT_MAP: Record<EmployeeQuery["sortBy"], string> = {
  name: "name",
  email: "email",
  department: "department",
  salary: "salary",
  joiningDate: "joiningDate",
  createdAt: "createdAt",
};

function buildFilter(query: EmployeeQuery): QueryFilter<EmployeeDoc> {
  const filter: QueryFilter<EmployeeDoc> = { isDeleted: false };

  if (query.department) filter.department = query.department;
  if (query.status) filter.status = query.status;

  if (query.search) {
    const expression = new RegExp(escapeRegex(query.search), "i");
    filter.$or = [
      { name: expression },
      { email: expression },
      { employeeId: expression },
    ];
  }

  return filter;
}

function buildSort(query: EmployeeQuery): Record<string, 1 | -1> {
  const direction = query.order === "asc" ? 1 : -1;
  return { [SORT_MAP[query.sortBy]]: direction, _id: direction };
}

function asDtoInput(document: unknown): EmployeeDTOInput {
  return document as EmployeeDTOInput;
}

function assertObjectId(id: string): void {
  if (!mongoose.isValidObjectId(id)) {
    throw new BadRequestError("Invalid employee id");
  }
}

export interface EmployeeListResult {
  items: EmployeeDTO[];
  pagination: Pagination;
}

export async function listEmployees(
  query: EmployeeQuery,
): Promise<EmployeeListResult> {
  const filter = buildFilter(query);
  const skip = (query.page - 1) * query.limit;

  const [documents, total] = await Promise.all([
    Employee.find(filter)
      .sort(buildSort(query))
      .skip(skip)
      .limit(query.limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / query.limit);

  return {
    items: documents.map((document) => toEmployeeDTO(asDtoInput(document))),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNext: query.page < totalPages,
      hasPrev: query.page > 1,
    },
  };
}

export async function getEmployeeById(id: string): Promise<EmployeeDTO> {
  assertObjectId(id);

  const document = await Employee.findOne({ _id: id, isDeleted: false }).lean();
  if (!document) throw new NotFoundError("Employee not found");

  return toEmployeeDTO(asDtoInput(document));
}

async function nextEmployeeId(): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { _id: EMPLOYEE_COUNTER_ID },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  ).lean();

  if (!counter) throw new Error("Could not generate an employee id");

  return `${EMPLOYEE_ID_PREFIX}-${String(counter.seq).padStart(4, "0")}`;
}

export async function createEmployee(
  input: CreateEmployeeInput,
): Promise<EmployeeDTO> {
  const duplicate = await Employee.exists({
    email: input.email,
    isDeleted: false,
  });

  if (duplicate) {
    throw new ConflictError("Email already exists", [
      { field: "email", message: "This email is already in use" },
    ]);
  }

  const employeeId = await nextEmployeeId();
  const document = await Employee.create({
    ...input,
    employeeId,
    isDeleted: false,
    deletedAt: null,
  });

  return toEmployeeDTO(asDtoInput(document.toObject()));
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput,
): Promise<EmployeeDTO> {
  assertObjectId(id);

  if (input.email) {
    const duplicate = await Employee.exists({
      email: input.email,
      isDeleted: false,
      _id: { $ne: new mongoose.Types.ObjectId(id) },
    });

    if (duplicate) {
      throw new ConflictError("Email already exists", [
        { field: "email", message: "This email is already in use" },
      ]);
    }
  }

  const document = await Employee.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: input },
    { returnDocument: "after", runValidators: true },
  ).lean();

  if (!document) throw new NotFoundError("Employee not found");

  return toEmployeeDTO(asDtoInput(document));
}

export async function deleteEmployee(id: string): Promise<void> {
  assertObjectId(id);

  const document = await Employee.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();

  if (!document) throw new NotFoundError("Employee not found");

  // Soft-deleting an employee automatically disables their login.
  await User.updateOne(
    { employeeRef: id },
    { $set: { isActive: false }, $inc: { tokenVersion: 1 } },
  );
}

export interface EmployeeCsvResult {
  csv: string;
  filename: string;
}

export async function exportEmployeesCsv(
  query: EmployeeQuery,
): Promise<EmployeeCsvResult> {
  const documents = await Employee.find(buildFilter(query))
    .sort(buildSort(query))
    .limit(MAX_EXPORT_ROWS)
    .lean();

  const employees = documents.map((document) =>
    toEmployeeDTO(asDtoInput(document)),
  );

  const csv = buildCsv(
    [
      "Employee ID",
      "Name",
      "Email",
      "Phone",
      "Department",
      "Designation",
      "Salary (INR)",
      "Joining Date",
      "Status",
      "Created At",
    ],
    employees.map((employee) => [
      employee.employeeId,
      employee.name,
      employee.email,
      employee.phone,
      employee.department,
      employee.designation,
      employee.salary,
      employee.joiningDate.slice(0, 10),
      employee.status,
      employee.createdAt,
    ]),
  );

  return {
    csv,
    filename: `employees-${new Date().toISOString().slice(0, 10)}.csv`,
  };
}

export async function getOwnProfile(
  userId: string,
): Promise<EmployeeDTO> {
  const user = await User.findById(userId).select("employeeRef").lean();
  if (!user || !user.employeeRef) {
    throw new NotFoundError("Employee record not found");
  }

  return getEmployeeById(String(user.employeeRef));
}
