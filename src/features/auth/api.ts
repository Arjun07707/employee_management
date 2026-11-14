import { apiFetch } from "@/lib/api-client";
import type { SessionUserDTO } from "@/shared/types/account";
import { changeCredentialsFormSchema } from "@/shared/schemas/account.schema";
import type { z } from "zod";

export interface LoginInput {
  username: string;
  password: string;
}

export async function login(input: LoginInput): Promise<SessionUserDTO> {
  return apiFetch<SessionUserDTO>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
    skipAuthRedirect: true,
  });
}

export async function logout(): Promise<void> {
  await apiFetch<null>("/api/auth/logout", { method: "POST" });
}

export async function me(): Promise<SessionUserDTO | null> {
  try {
    return await apiFetch<SessionUserDTO>("/api/auth/me", {
      skipAuthRedirect: true,
    });
  } catch {
    return null;
  }
}

export async function changeCredentials(
  input: z.infer<typeof changeCredentialsFormSchema>,
): Promise<{ user: SessionUserDTO; token: string }> {
  return apiFetch<{ user: SessionUserDTO; token: string }>(
    "/api/auth/change-credentials",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}
