import "./load-env";

import bcrypt from "bcryptjs";

import { env } from "@/server/config/env";
import { connectDB, disconnectDB } from "@/server/db/connect";
import { User } from "@/server/models/user.model";

async function main(): Promise<void> {
  await connectDB();

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  const admin = await User.findOneAndUpdate(
    { username: env.ADMIN_USERNAME },
    {
      $set: {
        name: "Administrator",
        username: env.ADMIN_USERNAME,
        passwordHash,
        role: "admin",
        isActive: true,
        mustChangePassword: false,
        employeeRef: null,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  console.log(`Admin account ready: ${admin?.username}`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
