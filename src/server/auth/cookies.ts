import "server-only";

import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME } from "@/shared/constants";
import { env } from "@/server/config/env";

import { tokenMaxAgeSeconds } from "./jwt";

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  path: "/",
};

export async function setAuthCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, token, {
    ...baseCookieOptions,
    maxAge: tokenMaxAgeSeconds(),
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, "", {
    ...baseCookieOptions,
    maxAge: 0,
  });
}

export async function getAuthToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(AUTH_COOKIE_NAME)?.value ?? null;
}
