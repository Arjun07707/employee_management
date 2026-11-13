/* TEMPORARY — smoke-test helper. Delete after UI verification. */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { readFileSync } from "node:fs";

async function main() {
  const uri = readFileSync(".tmp-mongo-uri.txt", "utf8").trim();
  await mongoose.connect(uri);

  const users = mongoose.connection.collection("users");
  const existing = await users.findOne({ email: "viewer@example.com" });
  if (!existing) {
    await users.insertOne({
      name: "Viewer User",
      email: "viewer@example.com",
      passwordHash: await bcrypt.hash("Viewer@12345", 12),
      role: "viewer",
      isActive: true,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("VIEWER_CREATED");
  } else {
    console.log("VIEWER_EXISTS");
  }
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error("FAILED", error);
  process.exit(1);
});
