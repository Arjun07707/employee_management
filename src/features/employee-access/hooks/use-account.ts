"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccountByEmployee } from "@/features/employee-access/api";
import type { AccountDTO } from "@/shared/types/account";

export function useAccount(employeeId: string) {
  return useQuery<AccountDTO | null>({
    queryKey: ["employee-account", employeeId],
    queryFn: () => getAccountByEmployee(employeeId),
    enabled: !!employeeId,
    staleTime: 30_000,
  });
}
