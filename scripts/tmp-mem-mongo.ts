/* TEMPORARY — smoke-test helper. Delete after UI verification. */
import { MongoMemoryServer } from "mongodb-memory-server";
import { writeFileSync } from "node:fs";

async function main() {
  const mongod = await MongoMemoryServer.create({
    instance: { port: 27817 },
  });

  writeFileSync(".tmp-mongo-uri.txt", mongod.getUri("employee_management"));
  console.log("MEMORY_MONGO_READY", mongod.getUri("employee_management"));

  // Keep the process alive until killed.
  process.on("SIGTERM", async () => {
    await mongod.stop();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("MEMORY_MONGO_FAILED", error);
  process.exit(1);
});
