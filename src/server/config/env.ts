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
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("Employee Management"),
});

export type Env = z.infer<typeof envSchema>;

const isBuild = process.env.NEXT_PHASE === "phase-production-build";

const buildPlaceholders: Record<string, string> = {
  NODE_ENV: "production",
  MONGODB_URI: "mongodb://127.0.0.1:27017/employee_management",
  JWT_SECRET: "x".repeat(32),
  JWT_EXPIRES_IN: DEFAULT_JWT_EXPIRES_IN,
  NEXT_PUBLIC_APP_NAME: "Employee Management",
};

let cached: Env | null = null;

function validate(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment variables -> ${details}`);
  }
  cached = parsed.data;
  return cached;
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (isBuild) {
      return buildPlaceholders[prop] ?? undefined;
    }
    return validate()[prop as keyof Env];
  },
});
