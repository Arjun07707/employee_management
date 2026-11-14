"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { ApiError } from "@/lib/api-client";
import {
  login as loginRequest,
  logout as logoutRequest,
} from "@/features/auth/api";
import type { LoginInput } from "@/features/auth/api";
import type { SessionUserDTO } from "@/shared/types/account";

interface UseAuthResult {
  submit: (input: LoginInput) => Promise<{ ok: boolean; message?: string }>;
  signingOut: boolean;
  signOut: () => Promise<void>;
  /** Session user when the parent passed one in. */
  user: SessionUserDTO | null;
}

export function useAuth(user: SessionUserDTO | null = null): UseAuthResult {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  const submit = React.useCallback(async (input: LoginInput) => {
    try {
      await loginRequest(input);
      return { ok: true };
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 429) {
          const minutes = Math.max(
            1,
            Math.ceil((error.retryAfter ?? 900) / 60),
          );
          return {
            ok: false,
            message: `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
          };
        }
        if (error.status === 401) {
          return { ok: false, message: "Invalid username or password" };
        }
        return { ok: false, message: error.message };
      }
      return { ok: false, message: "Something went wrong. Please try again." };
    }
  }, []);

  const signOut = React.useCallback(async () => {
    setSigningOut(true);
    try {
      await logoutRequest();
    } catch {
      // Even if the request fails, clear local state and head to login.
    } finally {
      setSigningOut(false);
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  return { submit, signingOut, signOut, user };
}
