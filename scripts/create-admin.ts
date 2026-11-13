import "./load-env";

import bcrypt from "bcryptjs";

import { env } from "@/server/config/env";
import { connectDB, disconnectDB } from "@/server/db/connect";
import { User } from "@/server/models/user.model";

async function main(): Promise<void> {
  await connectDB();

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  const admin = await User.findOneAndUpdate(
    { email: env.ADMIN_EMAIL },
    {
      $set: {
        name: "Admin",
        email: env.ADMIN_EMAIL,
        passwordHash,
        role: "admin",
        isActive: true,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();

  console.log(`Admin account ready: ${admin?.email}`);
}

main()
  .catch((error) => {
    console.error("Failed to create admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
