import type { Role } from "@/shared/constants";

export type UsernameCheckReason = "taken" | "invalid" | "reserved" | "current" | "ok";

export interface UsernameCheckResult {
  available: boolean;            // true for "ok" and "current"
  reason: UsernameCheckReason;
  message: string;
  suggestions?: string[];        // only when taken (max 3)
}

export interface AccountDTO {
  id: string;
  username: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  createdAt: string;
}

export interface SessionUserDTO {
  id: string;
  name: string;
  username: string;
  role: Role;
  mustChangePassword: boolean;
  employeeRef: string | null;
  tv: number;
}
