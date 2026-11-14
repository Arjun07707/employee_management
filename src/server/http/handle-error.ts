import "server-only";

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AUTH_COOKIE_NAME } from "@/shared/constants";

import { AppError, TooManyRequestsError } from "./errors";

interface ErrorItem {
  field?: string;
  message: string;
}

function fail(
  status: number,
  message: string,
  errors?: ErrorItem[],
  headers?: Record<string, string>,
  requestId?: string,
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      message,
      ...(errors ? { errors } : {}),
    },
    {
      status,
      headers: {
        ...(requestId ? { "x-request-id": requestId } : {}),
        ...headers,
      },
    },
  );

  // Clear a stale/unusable auth cookie on every 401 so the client can't be
  // bounced back and forth between a protected page and /login.
  if (status === 401) {
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      maxAge: 0,
      path: "/",
    });
  }

  return response;
}

export function handleError(error: unknown, requestId?: string): NextResponse {
  if (error instanceof ZodError) {
    const errors = error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return fail(400, "Validation failed", errors, undefined, requestId);
  }

  if (error instanceof TooManyRequestsError) {
    return fail(
      429,
      error.message,
      undefined,
      { "Retry-After": String(error.retryAfter) },
      requestId,
    );
  }

  if (error instanceof AppError) {
    return fail(
      error.statusCode,
      error.message,
      error.errors,
      undefined,
      requestId,
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: number }).code === 11000
  ) {
    const key = Object.keys(
      (error as { keyPattern?: Record<string, number> }).keyPattern ?? {},
    )[0];
    if (key === "username") {
      return fail(
        409,
        "Username is already taken",
        [{ field: "username", message: "This username is already taken" }],
        undefined,
        requestId,
      );
    }
    if (key === "employeeRef") {
      return fail(
        409,
        "This employee already has a login",
        [
          {
            field: "employeeRef",
            message: "This employee already has a login",
          },
        ],
        undefined,
        requestId,
      );
    }
    return fail(
      409,
      `Duplicate key on field: ${key ?? "unknown"}`,
      [
        {
          field: key ?? "unknown",
          message: `This ${key ?? "value"} is already in use`,
        },
      ],
      undefined,
      requestId,
    );
  }

  if (error instanceof mongoose.Error.CastError) {
    return fail(400, "Invalid identifier", undefined, undefined, requestId);
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
    return fail(400, "Validation failed", errors, undefined, requestId);
  }

  if (error instanceof SyntaxError) {
    return fail(400, "Invalid JSON body", undefined, undefined, requestId);
  }

  console.error(`[API ERROR]${requestId ? ` [${requestId}]` : ""}`, error);
  return fail(
    500,
    "Something went wrong. Please try again.",
    undefined,
    undefined,
    requestId,
  );
}
