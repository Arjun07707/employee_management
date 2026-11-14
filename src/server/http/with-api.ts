import "server-only";

import { randomUUID } from "node:crypto";

import { unstable_rethrow } from "next/navigation";
import { connection, type NextRequest, NextResponse } from "next/server";

import type { Role } from "@/shared/constants";
import type { SessionUserDTO } from "@/shared/types/account";
import { requireRole } from "@/server/auth/session";
import { connectDB } from "@/server/db/connect";
import { handleError } from "@/server/http/handle-error";
import { getClientIp } from "@/server/security/ip";
import {
  checkApiRateLimit,
  enforceRateLimit,
} from "@/server/security/rate-limit";

type ApiHandler<P> = (
  request: NextRequest,
  context: { params: P; user: SessionUserDTO | null; requestId: string },
) => Promise<NextResponse>;

export function withApi<P = Record<string, never>>(
  options: { roles?: readonly Role[]; allowMustChange?: boolean },
  handler: ApiHandler<P>,
) {
  return async (
    request: NextRequest,
    route: { params: Promise<P> },
  ): Promise<NextResponse> => {
    const requestId = request.headers.get("x-request-id") ?? randomUUID();

    try {
      // Opt out of prerendering: every API response is request-specific.
      await connection();

      // ORDER MATTERS: connectDB() must run BEFORE requireRole because
      // requireRole now queries MongoDB.
      await connectDB();

      checkApiRateLimit(getClientIp(request));

      const user = options.roles
        ? await requireRole(options.roles, {
            allowMustChange: options.allowMustChange,
          })
        : null;

      const params = route?.params ? await route.params : ({} as P);
      const response = await handler(request, { params, user, requestId });
      response.headers.set("x-request-id", requestId);
      return response;
    } catch (error) {
      unstable_rethrow(error);
      return handleError(error, requestId);
    }
  };
}

export { enforceRateLimit };
