import "server-only";

import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

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
  return NextResponse.json(
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
    return fail(
      409,
      "Email already exists",
      [{ field: "email", message: "This email is already in use" }],
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
