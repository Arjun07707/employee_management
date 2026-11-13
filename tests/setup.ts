import { afterAll, inject } from "vitest";

process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.JWT_EXPIRES_IN = "1h";
process.env.ADMIN_EMAIL = "admin@test.local";
process.env.ADMIN_PASSWORD = "Admin@12345";
process.env.NEXT_PUBLIC_APP_NAME = "Employee Management Test";
process.env.MONGODB_URI = inject("mongoUri");

afterAll(async () => {
  const { disconnectDB } = await import("@/server/db/connect");
  await disconnectDB();
});
