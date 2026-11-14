import "server-only";

import bcrypt from "bcryptjs";
import { z } from "zod";

import type { Role } from "@/shared/constants";
import type { SessionUserDTO } from "@/shared/types/account";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";
import { signSession } from "@/server/auth/jwt";
import { User } from "@/server/models/user.model";
import { loginSchema } from "@/shared/schemas/account.schema";

let dummyHash: string | null = null;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("not-a-real-password", 12));

export interface LoginResult {
  user: SessionUserDTO & { tokenVersion: number };
  token: string;
}

export async function login(
  input: z.infer<typeof loginSchema>,
): Promise<LoginResult> {
  const user = await User.findOne({ username: input.username }).select("+passwordHash");

  const passwordOk = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? getDummyHash(),
  );

  if (!user || !passwordOk) {
    throw new UnauthorizedError("Invalid username or password");
  }

  if (!user.isActive) {
    throw new ForbiddenError("Your account is disabled. Please contact your administrator.");
  }

  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

  const sessionUser: SessionUserDTO & { tokenVersion: number } = {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    role: user.role as Role,
    mustChangePassword: user.mustChangePassword,
    employeeRef: user.employeeRef ? String(user.employeeRef) : null,
    tokenVersion: user.tokenVersion,
    tv: user.tokenVersion,
  };

  return {
    user: sessionUser,
    token: await signSession(sessionUser),
  };
}

export async function getUserById(id: string): Promise<SessionUserDTO | null> {
  const user = await User.findById(id)
    .select("name username role isActive mustChangePassword employeeRef tokenVersion")
    .lean();

  if (!user) return null;

  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    role: user.role as Role,
    mustChangePassword: user.mustChangePassword,
    employeeRef: user.employeeRef ? String(user.employeeRef) : null,
    tv: user.tokenVersion,
  };
}
