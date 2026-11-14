import type {
  ApiErrorBody,
  ApiFieldError,
  ApiPaginated,
  ApiSuccess,
} from "@/shared/types/api";

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: ApiFieldError[];
  readonly retryAfter?: number;

  constructor(
    status: number,
    message: string,
    options: { errors?: ApiFieldError[]; retryAfter?: number } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = options.errors;
    this.retryAfter = options.retryAfter;
  }

  /** Field errors keyed by field name, for mapping onto a form. */
  fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const error of this.errors ?? []) {
      if (error.field && !map[error.field]) map[error.field] = error.message;
    }
    return map;
  }
}

async function readBody(response: Response): Promise<unknown> {
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export interface ApiFetchOptions extends RequestInit {
  /** Skip the automatic redirect to /login on 401. */
  skipAuthRedirect?: boolean;
}

/**
 * Typed fetch wrapper for the standard API envelope. Returns the `data`
 * payload (with `pagination` for paginated endpoints) and throws `ApiError`
 * for anything that is not a 2xx.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { skipAuthRedirect, headers, ...init } = options;

  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
  });

  if (response.ok) {
    const body = (await readBody(response)) as
      ApiSuccess<T> | ApiPaginated<T> | null;

    if (!body) return undefined as T;

    if ("pagination" in body) {
      // Paginated callers use `apiFetchPaginated`.
      return body.data as T;
    }

    return body.data;
  }

  const body = (await readBody(response)) as ApiErrorBody | null;

  if (
    response.status === 401 &&
    !skipAuthRedirect &&
    typeof window !== "undefined"
  ) {
    const current = window.location.pathname + window.location.search;

    // Already on the login page: surface the failure without a reload loop.
    if (current.startsWith("/login")) {
      throw new ApiError(
        401,
        "Session expired. Please sign in again.",
      );
    }

    const target =
      current.startsWith("/login") || current.startsWith("/api")
        ? "/login"
        : `/login?next=${encodeURIComponent(current)}`;
    window.location.assign(target);
  }

  const retryAfterHeader = response.headers.get("retry-after");
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;

  throw new ApiError(
    response.status,
    body?.message ?? "Something went wrong. Please try again.",
    {
      errors: body?.errors,
      retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
    },
  );
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: ApiPaginated<T>["pagination"];
}

/** Same as `apiFetch` but keeps the pagination block. */
export async function apiFetchPaginated<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<PaginatedResult<T>> {
  const { skipAuthRedirect, headers, ...init } = options;

  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(headers ?? {}),
    },
  });

  const body = (await readBody(response)) as
    ApiPaginated<T> | ApiErrorBody | null;

    if (!response.ok) {
    if (
      response.status === 401 &&
      !skipAuthRedirect &&
      typeof window !== "undefined"
    ) {
      const current = window.location.pathname + window.location.search;

      // Already on the login page: surface the failure without a reload loop.
      if (current.startsWith("/login")) {
        throw new ApiError(
          401,
          "Session expired. Please sign in again.",
        );
      }

      window.location.assign(
        current.startsWith("/login")
          ? "/login"
          : `/login?next=${encodeURIComponent(current)}`,
      );
    }

    const errorBody = body as ApiErrorBody | null;
    const retryAfterHeader = response.headers.get("retry-after");
    const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;

    throw new ApiError(
      response.status,
      errorBody?.message ?? "Something went wrong. Please try again.",
      {
        errors: errorBody?.errors,
        retryAfter: Number.isFinite(retryAfter) ? retryAfter : undefined,
      },
    );
  }

  return {
    data: (body as ApiPaginated<T>).data,
    pagination: (body as ApiPaginated<T>).pagination,
  };
}
