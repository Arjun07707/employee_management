"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAccountForEmployee } from "@/features/employee-access/api";
import type { AccountDTO } from "@/shared/types/account";
import { toast } from "sonner";

export function useCreateAccount(employeeId: string) {
  const queryClient = useQueryClient();

  return useMutation<AccountDTO, Error, { username: string; password: string; mustChangePassword?: boolean }>({
    mutationFn: (body) => createAccountForEmployee(employeeId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-account", employeeId] });
      toast.success("Login created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create login");
    },
  });
}
