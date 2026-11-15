import "./load-env";

import bcrypt from "bcryptjs";
import { z } from "zod";

import { connectDB, disconnectDB } from "@/server/db/connect";
import { User } from "@/server/models/user.model";

// Admin bootstrap credentials are only needed by this script, not by the web
// app at build/runtime. Keeping them out of the runtime env schema means a
// deployment (e.g. Vercel) does not fail to build when they are unset.
const adminEnvSchema = z.object({
  ADMIN_USERNAME: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "ADMIN_USERNAME must be at least 3 characters")
    .default("admin"),
  ADMIN_PASSWORD: z
    .string()
    .min(8, "ADMIN_PASSWORD must be at least 8 characters long"),
});

const parsedAdminEnv = adminEnvSchema.safeParse(process.env);

if (!parsedAdminEnv.success) {
  const details = parsedAdminEnv.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid admin environment variables -> ${details}`);
}

const adminEnv = parsedAdminEnv.data;

async function main(): Promise<void> {
  await connectDB();

  const passwordHash = await bcrypt.hash(adminEnv.ADMIN_PASSWORD, 12);

  const admin = await User.findOneAndUpdate(
    { username: adminEnv.ADMIN_USERNAME },
    {
      $set: {
        name: "Administrator",
        username: adminEnv.ADMIN_USERNAME,
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
