import "./load-env";

import mongoose from "mongoose";

import { env } from "@/server/config/env";
import { User } from "@/server/models/user.model";
import { USERNAME_MAX, USERNAME_MIN } from "@/shared/constants";

function deriveUsername(email: string): string {
  const local = email.split("@")[0] ?? "";
  let username = local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.+|\.+$/g, "");
  if (username.length < USERNAME_MIN) {
    username = (username + "user").slice(0, USERNAME_MAX);
  }
  return username.slice(0, USERNAME_MAX);
}


async function main(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });

  const users = await User.find({}).lean();

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.username) {
      skipped += 1;
      continue;
    }

    const email = (user as { email?: string }).email ?? `user${user._id}`;
    let username = deriveUsername(email);

    // Ensure uniqueness: append 2-digit counter until unique.
    let counter = 0;
    while (await User.exists({ username })) {
      counter += 1;
      const suffix = String(counter).padStart(2, "0");
      username = (deriveUsername(email) + suffix).slice(0, USERNAME_MAX);
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          username,
          tokenVersion: 0,
          mustChangePassword: false,
          employeeRef: null,
        },
      },
    );
    migrated += 1;
  }

  // Drop the old email unique index if it exists.
  try {
    await User.collection.dropIndex("email_1");
  } catch {
    // Index may not exist; ignore.
  }

  await User.syncIndexes();

  console.log(
    `Migration complete: migrated=${migrated} skipped(existing username)=${skipped} total=${users.length}`,
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
