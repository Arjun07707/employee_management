import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { CreateEmployeeInput } from "@/shared/schemas/employee.schema";
import { connectDB } from "@/server/db/connect";
import { Counter } from "@/server/models/counter.model";
import { Employee } from "@/server/models/employee.model";
import { createEmployee } from "@/server/services/employee.service";
import { getDashboardStats } from "@/server/services/dashboard.service";

function payload(
  overrides: Partial<CreateEmployeeInput> = {},
): CreateEmployeeInput {
  return {
    name: "Dashboard Person",
    email: "dashboard@example.com",
    phone: "+91 99999 11111",
    department: "Engineering",
    designation: "Engineer",
    salary: 1_000_000,
    joiningDate: new Date(),
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

describe("dashboard service", () => {
  it("zero-fills every department and counts statuses", async () => {
    const now = new Date();
    const firstOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    await createEmployee(
      payload({
        email: "one@example.com",
        department: "Engineering",
        salary: 1_000_000,
        joiningDate: firstOfMonth,
      }),
    );
    await createEmployee(
      payload({
        email: "two@example.com",
        department: "Engineering",
        salary: 2_000_000,
        status: "inactive",
        joiningDate: new Date("2020-01-15T00:00:00.000Z"),
      }),
    );
    await createEmployee(
      payload({
        email: "three@example.com",
        department: "HR",
        salary: 500_000,
        status: "on_leave",
        joiningDate: new Date("2021-06-15T00:00:00.000Z"),
      }),
    );

    const stats = await getDashboardStats();

    expect(stats.totalEmployees).toBe(3);
    expect(stats.active).toBe(1);
    expect(stats.inactive).toBe(1);
    expect(stats.onLeave).toBe(1);
    expect(stats.newThisMonth).toBe(1);
    expect(stats.departmentStats).toHaveLength(8);

    const engineering = stats.departmentStats.find(
      (item) => item.department === "Engineering",
    );
    expect(engineering).toMatchObject({ count: 2, avgSalary: 1_500_000 });

    const design = stats.departmentStats.find(
      (item) => item.department === "Design",
    );
    expect(design).toMatchObject({ count: 0, avgSalary: 0 });

    expect(stats.recentEmployees).toHaveLength(3);
  });

  it("returns an empty, fully zero-filled payload with no employees", async () => {
    const stats = await getDashboardStats();

    expect(stats.totalEmployees).toBe(0);
    expect(stats.departmentStats).toHaveLength(8);
    expect(stats.departmentStats.every((item) => item.count === 0)).toBe(true);
    expect(stats.recentEmployees).toEqual([]);
  });
});
