import "server-only";

import { NextResponse } from "next/server";

import type { ApiPaginated, ApiSuccess, Pagination } from "@/shared/types/api";

export function ok<T>(data: T, message?: string): NextResponse {
  const body: ApiSuccess<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
  };
  return NextResponse.json(body, { status: 200 });
}

export function created<T>(data: T, message?: string): NextResponse {
  const body: ApiSuccess<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
  };
  return NextResponse.json(body, { status: 201 });
}

export function paginated<T>(
  data: T[],
  pagination: Pagination,
  message?: string,
): NextResponse {
  const body: ApiPaginated<T> = {
    success: true,
    ...(message ? { message } : {}),
    data,
    pagination,
  };
  return NextResponse.json(body, { status: 200 });
}
