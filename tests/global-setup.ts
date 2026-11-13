import { MongoMemoryServer } from "mongodb-memory-server";
import type { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
  const mongo = await MongoMemoryServer.create({
    instance: { dbName: "employee_management_test" },
  });

  project.provide("mongoUri", mongo.getUri("employee_management_test"));

  return async () => {
    await mongo.stop();
  };
}
