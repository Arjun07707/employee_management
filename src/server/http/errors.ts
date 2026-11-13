import "server-only";

export interface AppFieldError {
  field?: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly errors?: AppFieldError[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, errors?: AppFieldError[]) {
    super(message, 400, errors);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission") {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, errors?: AppFieldError[]) {
    super(message, 409, errors);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(public readonly retryAfter: number) {
    super("Too many requests", 429);
  }
}
