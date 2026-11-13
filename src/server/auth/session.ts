import "server-only";

import type { Role } from "@/shared/constants";
import type { SessionUser } from "@/shared/types/auth";
import { ForbiddenError, UnauthorizedError } from "@/server/http/errors";

import { getAuthToken } from "./cookies";
import { verifySessionToken } from "./jwt";

export async function getSession(): Promise<SessionUser | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requireRole(
  roles: readonly Role[],
): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ForbiddenError();
  return user;
}
