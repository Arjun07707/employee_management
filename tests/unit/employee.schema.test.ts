import { describe, expect, it } from "vitest";

import {
  createEmployeeSchema,
  employeeQuerySchema,
  updateEmployeeSchema,
} from "@/shared/schemas/employee.schema";

const validPayload = {
  name: "Priya Sharma",
  email: "priya.sharma@example.com",
  phone: "+91 98765 43210",
  department: "Engineering",
  designation: "Senior Software Engineer",
  salary: 1_850_000,
  joiningDate: "2023-04-17",
  status: "active",
};

describe("createEmployeeSchema", () => {
  it("accepts a valid payload and normalises the email", () => {
    const parsed = createEmployeeSchema.parse({
      ...validPayload,
      email: "  PRIYA.SHARMA@EXAMPLE.COM ",
    });

    expect(parsed.email).toBe("priya.sharma@example.com");
    expect(parsed.joiningDate).toBeInstanceOf(Date);
  });

  it("defaults status to active", () => {
    const { status, ...withoutStatus } = validPayload;
    expect(status).toBe("active");

    const parsed = createEmployeeSchema.parse(withoutStatus);
    expect(parsed.status).toBe("active");
  });

  it("rejects an invalid email", () => {
    const result = createEmployeeSchema.safeParse({
      ...validPayload,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative salary", () => {
    const result = createEmployeeSchema.safeParse({
      ...validPayload,
      salary: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a too-short name", () => {
    const result = createEmployeeSchema.safeParse({
      ...validPayload,
      name: "A",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a bad phone number", () => {
    const result = createEmployeeSchema.safeParse({
      ...validPayload,
      phone: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a joining date more than 30 days in the future", () => {
    const farFuture = new Date();
    farFuture.setUTCDate(farFuture.getUTCDate() + 45);

    const result = createEmployeeSchema.safeParse({
      ...validPayload,
      joiningDate: farFuture.toISOString(),
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown body keys", () => {
    const result = createEmployeeSchema.safeParse({
      ...validPayload,
      isDeleted: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("updateEmployeeSchema", () => {
  it("rejects an empty patch body", () => {
    expect(updateEmployeeSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a partial patch", () => {
    expect(updateEmployeeSchema.safeParse({ salary: 100 }).success).toBe(true);
  });
});

describe("employeeQuerySchema", () => {
  it("applies defaults", () => {
    const parsed = employeeQuerySchema.parse({});
    expect(parsed).toMatchObject({
      sortBy: "createdAt",
      order: "desc",
      page: 1,
      limit: 10,
    });
  });

  it("rejects limit over 100", () => {
    expect(employeeQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });

  it("rejects unknown query params", () => {
    expect(employeeQuerySchema.safeParse({ $where: "true" }).success).toBe(
      false,
    );
  });

  it("turns an empty search into undefined", () => {
    expect(employeeQuerySchema.parse({ search: "  " }).search).toBeUndefined();
  });
});
