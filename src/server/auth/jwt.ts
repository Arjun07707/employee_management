import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

import { ROLES } from "@/shared/constants";
import type { SessionUserDTO } from "@/shared/types/account";
import { env } from "@/server/config/env";

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

const payloadSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(ROLES),
  username: z.string().min(1),
  name: z.string().min(1),
  tv: z.number().int().nonnegative(),
  mcp: z.boolean(),
});

export async function signSession(
  user: SessionUserDTO & { tokenVersion: number },
): Promise<string> {
  return new SignJWT({
    role: user.role,
    username: user.username,
    name: user.name,
    tv: user.tokenVersion,
    mcp: user.mustChangePassword,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey);
}

export async function verifyToken(
  token: string,
): Promise<SessionUserDTO | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) return null;

    return {
      id: parsed.data.sub,
      role: parsed.data.role,
      username: parsed.data.username,
      name: parsed.data.name,
      mustChangePassword: parsed.data.mcp,
      employeeRef: null,
      tv: parsed.data.tv,
    };
  } catch {
    return null;
  }
}

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3_600,
  d: 86_400,
};

export function tokenMaxAgeSeconds(): number {
  const match = /^(\d+)([smhd])$/.exec(env.JWT_EXPIRES_IN);
  if (!match) return 7 * UNIT_SECONDS.d!;
  return Number(match[1]) * (UNIT_SECONDS[match[2]!] ?? UNIT_SECONDS.d!);
}
