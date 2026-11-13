import "server-only";

import type { NextRequest } from "next/server";
import type { z } from "zod";

import { BadRequestError } from "@/server/http/errors";
import { sanitize } from "@/server/security/sanitize";

export async function parseJson<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
): Promise<T> {
  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }

  return schema.parse(sanitize(raw));
}
