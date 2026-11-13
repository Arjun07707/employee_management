import "server-only";

import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

import { ROLES } from "@/shared/constants";
import type { SessionUser } from "@/shared/types/auth";
import { env } from "@/server/config/env";

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

const payloadSchema = z.object({
  sub: z.string().min(1),
  role: z.enum(ROLES),
  name: z.string().min(1),
  email: z.string().email(),
});

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    role: user.role,
    name: user.name,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secretKey);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });
    const parsed = payloadSchema.safeParse(payload);
    if (!parsed.success) return null;

    return {
      id: parsed.data.sub,
      role: parsed.data.role,
      name: parsed.data.name,
      email: parsed.data.email,
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
