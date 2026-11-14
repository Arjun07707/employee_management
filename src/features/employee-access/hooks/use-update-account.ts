"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateAccountForEmployee } from "@/features/employee-access/api";
import type { AccountDTO } from "@/shared/types/account";

export interface UpdateAccountInput {
  username?: string;
  newPassword?: string;
  isActive?: boolean;
}

export function useUpdateAccount(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation<AccountDTO, Error, UpdateAccountInput>({
    mutationFn: (body) => updateAccountForEmployee(employeeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["employee-account", employeeId],
      });
      toast.success("Login updated");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update login");
    },
  });
}
