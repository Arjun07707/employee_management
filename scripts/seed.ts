import "./load-env";

import { faker } from "@faker-js/faker";

import { DEPARTMENTS, type EmployeeStatus } from "@/shared/constants";
import { env } from "@/server/config/env";
import { connectDB, disconnectDB } from "@/server/db/connect";
import { Counter } from "@/server/models/counter.model";
import { Employee } from "@/server/models/employee.model";
import { createEmployee } from "@/server/services/employee.service";

faker.seed(42);

const DESIGNATIONS: Record<string, string[]> = {
  Engineering: ["Software Engineer", "Senior Software Engineer", "Tech Lead"],
  HR: ["HR Executive", "HR Manager", "Recruiter"],
  Finance: ["Accountant", "Financial Analyst", "Finance Manager"],
  Sales: ["Sales Executive", "Account Manager", "Sales Lead"],
  Marketing: ["Marketing Executive", "Content Strategist", "Growth Manager"],
  Operations: ["Operations Executive", "Operations Manager", "Coordinator"],
  Support: ["Support Engineer", "Customer Success Executive", "Support Lead"],
  Design: ["UI Designer", "Product Designer", "Design Lead"],
};

function pickStatus(index: number): EmployeeStatus {
  if (index % 10 < 7) return "active";
  if (index % 10 < 9) return "on_leave";
  return "inactive";
}

async function main(): Promise<void> {
  const clear = process.argv.includes("--clear");
  const count = 60;

  if (env.NODE_ENV === "production") {
    throw new Error("Refusing to seed a production database");
  }

  await connectDB();

  if (clear) {
    await Promise.all([
      Employee.deleteMany({}),
      Counter.deleteOne({ _id: "employee" }),
    ]);
    console.log("Cleared employees and counter.");
  }

  const now = new Date();
  const fiveYearsAgo = new Date(
    Date.UTC(now.getUTCFullYear() - 5, now.getUTCMonth(), now.getUTCDate()),
  );

  for (let index = 0; index < count; index += 1) {
    const department = DEPARTMENTS[index % DEPARTMENTS.length]!;
    const designations = DESIGNATIONS[department]!;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;

    await createEmployee({
      name,
      email: `employee${index + 1}.${faker.string.alphanumeric(8).toLowerCase()}@example.com`,
      phone: `+91 ${faker.string.numeric(5)} ${faker.string.numeric(5)}`,
      department,
      designation: designations[index % designations.length]!,
      salary: faker.number.int({ min: 300_000, max: 3_000_000 }),
      joiningDate: faker.date.between({ from: fiveYearsAgo, to: now }),
      status: pickStatus(index),
    });
  }

  await Employee.syncIndexes();

  const total = await Employee.countDocuments({ isDeleted: false });
  console.log(`Seeded ${count} employees (${total} active records).`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
