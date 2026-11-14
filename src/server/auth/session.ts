import "server-only";

import { cookies } from "next/headers";

import type { Role } from "@/shared/constants";
import type { SessionUserDTO } from "@/shared/types/account";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";
import { User } from "@/server/models/user.model";
import { verifyToken } from "./jwt";

const AUTH_COOKIE = "ems_token";

export async function getSession(): Promise<SessionUserDTO | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireUser(): Promise<SessionUserDTO> {
  const user = await getSession();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(
  roles: readonly Role[],
  opts: { allowMustChange?: boolean } = {},
): Promise<SessionUserDTO> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  const payload = token ? await verifyToken(token).catch(() => null) : null;
  if (!payload) throw new UnauthorizedError();

  const u = await User.findById(payload.id)
    .select("name username role isActive tokenVersion mustChangePassword employeeRef")
    .lean();

  if (!u || !u.isActive || u.tokenVersion !== payload.tv) {
    throw new UnauthorizedError("Session expired. Please sign in again.");
  }
  if (u.mustChangePassword && !opts.allowMustChange) {
    throw new ForbiddenError("You must change your password before continuing");
  }
  if (!roles.includes(u.role as Role)) throw new ForbiddenError();

  return {
    id: String(u._id),
    name: u.name,
    username: u.username,
    role: u.role as Role,
    mustChangePassword: u.mustChangePassword,
    employeeRef: u.employeeRef ? String(u.employeeRef) : null,
    tv: u.tokenVersion,
  };
}
