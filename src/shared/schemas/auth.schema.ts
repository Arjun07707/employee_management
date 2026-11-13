import { z } from "zod";

import { emailSchema } from "./employee.schema";

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
