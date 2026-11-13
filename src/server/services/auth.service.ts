import "server-only";

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import type { Role } from "@/shared/constants";
import type { SessionUser } from "@/shared/types/auth";
import { signSessionToken } from "@/server/auth/jwt";
import { UnauthorizedError } from "@/server/http/errors";
import { User } from "@/server/models/user.model";

export interface LoginResult {
  user: SessionUser;
  token: string;
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !user.isActive) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError("Invalid email or password");
  }

  await User.updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date() } },
  );

  const sessionUser: SessionUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as Role,
  };

  return {
    user: sessionUser,
    token: await signSessionToken(sessionUser),
  };
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  if (!mongoose.isValidObjectId(id)) return null;

  const user = await User.findOne({ _id: id, isActive: true }).lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as Role,
  };
}
