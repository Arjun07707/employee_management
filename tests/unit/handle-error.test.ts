import { describe, expect, it } from "vitest";
import { z } from "zod";

import { ConflictError, NotFoundError } from "@/server/http/errors";
import { handleError } from "@/server/http/handle-error";

describe("handleError", () => {
  it("maps a ZodError to 400 with field errors", async () => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: "bad" });

    if (result.success) throw new Error("Expected validation to fail");

    const response = handleError(result.error);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({
      success: false,
      message: "Validation failed",
      errors: [{ field: "email" }],
    });
  });

  it("maps AppError subclasses to their status code", async () => {
    const notFound = handleError(new NotFoundError("Employee not found"));
    expect(notFound.status).toBe(404);

    const conflict = handleError(
      new ConflictError("Email already exists", [
        { field: "email", message: "This email is already in use" },
      ]),
    );

    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      success: false,
      errors: [{ field: "email" }],
    });
  });

  it("maps a Mongo duplicate-key error to 409", async () => {
    const response = handleError({ code: 11000 });
    expect(response.status).toBe(409);
  });

  it("does not leak unexpected error details", async () => {
    const response = handleError(new Error("database password is hunter2"));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.message).toBe("Something went wrong. Please try again.");
  });
});
