import { apiFetch } from "@/lib/api-client";
import type { SessionUser } from "@/shared/types/auth";

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<SessionUser> {
  return apiFetch<SessionUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRedirect: true,
  });
}

export async function logout(): Promise<void> {
  await apiFetch<null>("/api/auth/logout", { method: "POST" });
}

export async function me(): Promise<SessionUser | null> {
  try {
    return await apiFetch<SessionUser>("/api/auth/me", {
      skipAuthRedirect: true,
    });
  } catch {
    return null;
  }
}
