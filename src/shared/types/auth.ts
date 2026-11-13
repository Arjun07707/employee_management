import type { Role } from "@/shared/constants";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}
