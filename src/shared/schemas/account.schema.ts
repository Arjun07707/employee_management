import { z } from "zod";

import {
  RESERVED_USERNAMES,
  USERNAME_MAX,
  USERNAME_MIN,
} from "@/shared/constants";

// lowercase letters/digits; single . _ - allowed BETWEEN alphanumerics (no leading/trailing/double separators)
export const USERNAME_REGEX = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(USERNAME_MIN, `Username must be at least ${USERNAME_MIN} characters`)
  .max(USERNAME_MAX, `Username must be at most ${USERNAME_MAX} characters`)
  .regex(
    USERNAME_REGEX,
    "Use letters, numbers and single . _ - between characters",
  )
  .refine(
    (u) => !(RESERVED_USERNAMES as readonly string[]).includes(u),
    "This username is reserved",
  );

// bcrypt only uses the first 72 BYTES, so cap at 72 to avoid silent truncation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Username is required")
    .max(USERNAME_MAX),
  password: z.string().min(1, "Password is required").max(72),
});

export const createAccountSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  mustChangePassword: z.boolean().default(true),
});

export const adminUpdateAccountSchema = z
  .object({
    username: usernameSchema.optional(),
    newPassword: passwordSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (v) => Object.keys(v).length > 0,
    "Provide at least one field to update",
  );

export const changeCredentialsSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required").max(72),
    newUsername: usernameSchema.optional(),
    newPassword: passwordSchema.optional(),
  })
  .refine(
    (v) => v.newUsername || v.newPassword,
    "Provide a new username or a new password",
  )
  .refine((v) => !v.newPassword || v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current password",
  });

// client-only extension (confirm field)
export const changeCredentialsFormSchema = changeCredentialsSchema
  .and(z.object({ confirmPassword: z.string().optional() }))
  .refine((v) => !v.newPassword || v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type AdminUpdateAccountInput = z.infer<typeof adminUpdateAccountSchema>;
export type ChangeCredentialsInput = z.infer<typeof changeCredentialsSchema>;
