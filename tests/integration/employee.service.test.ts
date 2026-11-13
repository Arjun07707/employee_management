import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { CreateEmployeeInput } from "@/shared/schemas/employee.schema";
import { employeeQuerySchema } from "@/shared/schemas/employee.schema";
import { connectDB } from "@/server/db/connect";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/http/errors";
import { Counter } from "@/server/models/counter.model";
import { Employee } from "@/server/models/employee.model";
import {
  createEmployee,
  deleteEmployee,
  exportEmployeesCsv,
  getEmployeeById,
  listEmployees,
  updateEmployee,
} from "@/server/services/employee.service";

function payload(
  overrides: Partial<CreateEmployeeInput> = {},
): CreateEmployeeInput {
  return {
    name: "Priya Sharma",
    email: "priya.sharma@example.com",
    phone: "+91 98765 43210",
    department: "Engineering",
    designation: "Senior Software Engineer",
    salary: 1_850_000,
    joiningDate: new Date("2023-04-17T00:00:00.000Z"),
    status: "active",
    ...overrides,
  };
}

beforeAll(async () => {
  await connectDB();
  await Employee.syncIndexes();
});

beforeEach(async () => {
  await Promise.all([
    Employee.deleteMany({}),
    Counter.deleteOne({ _id: "employee" }),
  ]);
});

describe("employee service", () => {
  it("creates employees with sequential ids", async () => {
    const first = await createEmployee(payload());
    const second = await createEmployee(
      payload({ email: "second@example.com" }),
    );

    expect(first.employeeId).toBe("EMP-0001");
    expect(second.employeeId).toBe("EMP-0002");
    expect(first.id).toMatch(/^[a-f\d]{24}$/);
  });

  it("blocks a duplicate email with a 409 field error", async () => {
    await createEmployee(payload());

    try {
      await createEmployee(payload({ name: "Another Person" }));
      throw new Error("Expected a ConflictError");
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictError);
      expect((error as ConflictError).statusCode).toBe(409);
      expect((error as ConflictError).errors?.[0]?.field).toBe("email");
    }
  });

  it("filters, searches, sorts and paginates", async () => {
    await createEmployee(
      payload({
        name: "Alice Engineer",
        email: "alice@example.com",
        salary: 100,
      }),
    );
    await createEmployee(
      payload({
        name: "Bob Manager",
        email: "bob@example.com",
        department: "HR",
        salary: 300,
        status: "inactive",
      }),
    );
    await createEmployee(
      payload({
        name: "Carol Engineer",
        email: "carol@example.com",
        salary: 200,
        status: "on_leave",
      }),
    );

    const search = await listEmployees(
      employeeQuerySchema.parse({ search: "alice" }),
    );
    expect(search.items).toHaveLength(1);
    expect(search.items[0]?.name).toBe("Alice Engineer");

    const byDepartment = await listEmployees(
      employeeQuerySchema.parse({ department: "Engineering" }),
    );
    expect(byDepartment.pagination.total).toBe(2);

    const sorted = await listEmployees(
      employeeQuerySchema.parse({
        sortBy: "salary",
        order: "asc",
        limit: "1",
      }),
    );
    expect(sorted.items[0]?.name).toBe("Alice Engineer");
    expect(sorted.pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 3,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    });
  });

  it("soft deletes, hides the record, and frees the email", async () => {
    const employee = await createEmployee(payload());

    await deleteEmployee(employee.id);
    expect(
      (await listEmployees(employeeQuerySchema.parse({}))).items,
    ).toHaveLength(0);

    await expect(deleteEmployee(employee.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );

    const recreated = await createEmployee(payload());
    expect(recreated.email).toBe(employee.email);
    expect(recreated.employeeId).toBe("EMP-0002");
  });

  it("rejects an invalid id and reports a missing employee", async () => {
    await expect(getEmployeeById("not-an-object-id")).rejects.toBeInstanceOf(
      BadRequestError,
    );

    await expect(
      getEmployeeById("64b7f1a2c3d4e5f60718293a"),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("re-checks email uniqueness on update but excludes itself", async () => {
    const first = await createEmployee(payload());
    await createEmployee(payload({ email: "other@example.com" }));

    await expect(
      updateEmployee(first.id, { email: "other@example.com" }),
    ).rejects.toBeInstanceOf(ConflictError);

    const updated = await updateEmployee(first.id, {
      email: first.email,
      salary: 2_000_000,
    });
    expect(updated.salary).toBe(2_000_000);
  });

  it("exports a BOM-prefixed RFC-4180 CSV", async () => {
    await createEmployee(
      payload({ name: 'Doe, "Jane"', email: "jane@example.com" }),
    );

    const { csv, filename } = await exportEmployeesCsv(
      employeeQuerySchema.parse({}),
    );

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"Doe, ""Jane"""');
    expect(filename).toMatch(/^employees-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
