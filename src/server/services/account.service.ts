import "server-only";

import bcrypt from "bcryptjs";
import { Types } from "mongoose";

import {
  FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN,
  RESERVED_USERNAMES,
} from "@/shared/constants";
import type { Role } from "@/shared/constants";
import {
  usernameSchema,
} from "@/shared/schemas/account.schema";
import type { UsernameCheckResult } from "@/shared/types/account";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from "@/server/http/errors";
import { signSession } from "@/server/auth/jwt";
import { User } from "@/server/models/user.model";
import type { SessionUserDTO } from "@/shared/types/account";
import type { EmployeeDoc } from "@/server/models/employee.model";
import { Employee } from "@/server/models/employee.model";

const BCRYPT_COST = 12;

function toAccountDTO(user: {
  _id: unknown;
  username: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: Date | null | undefined;
  passwordChangedAt?: Date | null | undefined;
  createdAt?: Date | null | undefined;
}): {
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
} {
  return {
    id: String(user._id),
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    passwordChangedAt: user.passwordChangedAt
      ? user.passwordChangedAt.toISOString()
      : null,
    createdAt: user.createdAt!.toISOString(),
  };
}

async function getEmployeeEntity(
  employeeId: string,
): Promise<EmployeeDoc & { _id: Types.ObjectId }> {
  const employee = await Employee.findById(employeeId).lean();
  if (!employee || employee.isDeleted) {
    throw new NotFoundError("Employee not found");
  }
  return employee as unknown as (EmployeeDoc & { _id: Types.ObjectId });
}

// ---- availability (used by the live check) ----
export async function checkUsernameAvailability(
  raw: string,
  ctx: { excludeUserId?: string } = {},
): Promise<UsernameCheckResult> {
  const username = raw.trim().toLowerCase();

  if ((RESERVED_USERNAMES as readonly string[]).includes(username)) {
    return {
      available: false,
      reason: "reserved",
      message: "This username is reserved",
    };
  }

  const parsed = usernameSchema.safeParse(username);
  if (!parsed.success) {
    return {
      available: false,
      reason: "invalid",
      message: parsed.error.issues[0]!.message,
    };
  }

  const existing = await User.findOne({ username }).select("_id").lean();
  if (!existing) {
    return {
      available: true,
      reason: "ok",
      message: `${username} is available`,
    };
  }

  if (ctx.excludeUserId && String(existing._id) === ctx.excludeUserId) {
    return {
      available: true,
      reason: "current",
      message: "This is your current username",
    };
  }

  return {
    available: false,
    reason: "taken",
    message: `${username} is already taken`,
    suggestions: await suggest(username),
  };
}

async function suggest(base: string): Promise<string[]> {
  const stem = base.slice(0, 26);
  const rand = (n: number) =>
    Math.floor(Math.random() * 10 ** n)
      .toString()
      .padStart(n, "0");
  const candidates = [
    `${stem}${rand(2)}`,
    `${stem}.${rand(2)}`,
    `${stem}_${new Date().getFullYear() % 100}`,
    `${stem}${rand(3)}`,
  ];

  const taken = new Set(
    (
      await User.find({ username: { $in: candidates } }).select("username").lean()
    ).map((u) => u.username),
  );

  return candidates
    .filter((c) => !taken.has(c) && usernameSchema.safeParse(c).success)
    .slice(0, 3);
}

// ---- admin: create login for an employee ----
export async function createAccountForEmployee(
  employeeId: string,
  input: {
    username: string;
    password: string;
    mustChangePassword?: boolean;
  },
  admin: SessionUserDTO,
): Promise<{
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
}> {
  const employee = await getEmployeeEntity(employeeId);

  if (await User.exists({ employeeRef: employee._id })) {
    throw new ConflictError("This employee already has a login");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
  const user = await User.create({
    name: employee.name,
    username: input.username,
    passwordHash,
    role: "employee",
    employeeRef: employee._id,
    mustChangePassword:
      FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN ? input.mustChangePassword ?? true : false,
    createdBy: admin.id,
  });

  return toAccountDTO(user);
}

export async function getAccountByEmployee(
  employeeId: string,
): Promise<{
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
} | null> {
  const user = await User.findOne({ employeeRef: employeeId }).lean();
  if (!user) return null;
  return toAccountDTO(user);
}

export async function getAccountUserIdByEmployee(
  employeeId: string,
): Promise<string | null> {
  const user = await User.findOne({ employeeRef: employeeId }).select("_id").lean();
  return user ? String(user._id) : null;
}

// ---- admin: update login ----
export async function adminUpdateAccount(
  employeeId: string,
  input: {
    username?: string;
    newPassword?: string;
    isActive?: boolean;
  },
): Promise<{
  id: string;
  username: string;
  role: string;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
}> {
  const user = await User.findOne({ employeeRef: employeeId });
  if (!user) throw new NotFoundError("This employee has no login yet");

  if (input.username && input.username !== user.username) {
    user.username = input.username;
  }

  if (input.newPassword) {
    user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST);
    user.mustChangePassword = FORCE_PASSWORD_CHANGE_ON_FIRST_LOGIN;
    user.passwordChangedAt = new Date();
    user.tokenVersion += 1;
  }

  if (input.isActive !== undefined) {
    user.isActive = input.isActive;
    if (!input.isActive) user.tokenVersion += 1;
  }

  await user.save();
  return toAccountDTO(user);
}

// ---- self-service: change own credentials ----
export async function changeOwnCredentials(
  userId: string,
  input: {
    currentPassword: string;
    newUsername?: string;
    newPassword?: string;
  },
): Promise<{
  user: SessionUserDTO & { tokenVersion: number };
  token: string;
}> {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) throw new NotFoundError("Account not found");

  const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!ok) {
    throw new BadRequestError(
      "Current password is incorrect",
      [{ field: "currentPassword", message: "Current password is incorrect" }],
    );
  }

  if (input.newUsername) user.username = input.newUsername;
  if (input.newPassword) {
    user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_COST);
    user.passwordChangedAt = new Date();
  }

  user.mustChangePassword = false;
  user.tokenVersion += 1;
  await user.save();

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
