import "server-only";

import { z } from "zod";

import { DEFAULT_JWT_EXPIRES_IN } from "@/shared/constants";

const expiresInSchema = z
  .string()
  .regex(/^\d+[smhd]$/, "JWT_EXPIRES_IN must look like 30m, 12h or 7d")
  .default(DEFAULT_JWT_EXPIRES_IN);

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: expiresInSchema,
  ADMIN_EMAIL: z.string().trim().toLowerCase().email("Invalid ADMIN_EMAIL"),
  ADMIN_PASSWORD: z
    .string()
    .min(8, "ADMIN_PASSWORD must be at least 8 characters long"),
  ADMIN_USERNAME: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "ADMIN_USERNAME must be at least 3 characters")
    .default("admin"),
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("Employee Management"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment variables -> ${details}`);
}

export const env = parsed.data;

export type Env = typeof env;
