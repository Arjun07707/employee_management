import { apiFetch } from "@/lib/api-client";
import type { AccountDTO } from "@/shared/types/account";

export async function getAccountByEmployee(
  employeeId: string,
): Promise<AccountDTO | null> {
  return apiFetch<AccountDTO | null>(`/api/employees/${employeeId}/account`);
}

export async function createAccountForEmployee(
  employeeId: string,
  body: { username: string; password: string; mustChangePassword?: boolean },
): Promise<AccountDTO> {
  return apiFetch<AccountDTO>(`/api/employees/${employeeId}/account`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAccountForEmployee(
  employeeId: string,
  body: {
    username?: string;
    newPassword?: string;
    isActive?: boolean;
  },
): Promise<AccountDTO> {
  return apiFetch<AccountDTO>(`/api/employees/${employeeId}/account`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function checkUsernameAvailability(
  username: string,
  forEmployeeId?: string,
): Promise<{
  available: boolean;
  reason: string;
  message: string;
  suggestions?: string[];
}> {
  const params = new URLSearchParams({ username });
  if (forEmployeeId) params.set("forEmployee", forEmployeeId);
  return apiFetch<{
    available: boolean;
    reason: string;
    message: string;
    suggestions?: string[];
  }>(`/api/auth/username-available?${params.toString()}`);
}
