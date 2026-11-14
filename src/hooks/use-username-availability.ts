"use client";

import { apiFetch } from "@/lib/api-client";
import {
  RESERVED_USERNAMES,
  USERNAME_CHECK_DEBOUNCE_MS,
  USERNAME_MIN,
} from "@/shared/constants";
import { usernameSchema } from "@/shared/schemas/account.schema";
import type { UsernameCheckResult } from "@/shared/types/account";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useQuery } from "@tanstack/react-query";

export type UsernameStatus =
  | "idle"
  | "hint"
  | "invalid"
  | "reserved"
  | "checking"
  | "available"
  | "current"
  | "taken"
  | "error";

const accountApi = {
  checkUsername: async (
    username: string,
    forEmployeeId?: string,
    signal?: AbortSignal,
  ): Promise<UsernameCheckResult> => {
    const params = new URLSearchParams({ username });
    if (forEmployeeId) params.set("forEmployee", forEmployeeId);
    return apiFetch<UsernameCheckResult>(
      `/api/auth/username-available?${params.toString()}`,
      { signal },
    );
  },
};

export function useUsernameAvailability(
  value: string,
  opts: { forEmployeeId?: string; enabled?: boolean } = {},
) {
  const normalized = value.trim().toLowerCase();
  const debounced = useDebouncedValue(normalized, USERNAME_CHECK_DEBOUNCE_MS);
  const settled = normalized === debounced;
  const isReserved = (RESERVED_USERNAMES as readonly string[]).includes(normalized);
  const local = usernameSchema.safeParse(normalized);

  const query = useQuery({
    queryKey: ["username-available", debounced, opts.forEmployeeId ?? null],
    queryFn: ({ signal }) =>
      accountApi.checkUsername(debounced, opts.forEmployeeId, signal),
    enabled:
      (opts.enabled ?? true) &&
      settled &&
      usernameSchema.safeParse(debounced).success,
    staleTime: 10_000,
    gcTime: 30_000,
    retry: false,
  });

  let status: UsernameStatus;
  if (!normalized) status = "idle";
  else if (isReserved) status = "reserved";
  else if (!local.success)
    status = normalized.length < USERNAME_MIN ? "hint" : "invalid";
  else if (!settled || query.isFetching) status = "checking";
  else if (query.isError) status = "error";
  else if (query.data)
    status = query.data.reason === "current" ? "current" : query.data.available ? "available" : "taken";
  else status = "checking";

  const message =
    status === "invalid" || status === "hint"
      ? local.success ? "" : local.error.issues[0]!.message
      : status === "reserved"
        ? "This username is reserved"
        : status === "checking"
          ? "Checking availability..."
          : status === "error"
            ? "Could not check availability. Try again."
            : query.data?.message ?? "";
  const ok = status === "available" || status === "current";
  return {
    status,
    message,
    suggestions: query.data?.suggestions ?? [],
    isOk: ok,
    isBlocking: !!normalized && !ok,
  };
}
