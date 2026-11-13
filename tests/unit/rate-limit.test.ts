import { beforeEach, describe, expect, it } from "vitest";

import { TooManyRequestsError } from "@/server/http/errors";
import {
  checkLoginRateLimit,
  resetRateLimits,
} from "@/server/security/rate-limit";

describe("login rate limiter", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows five attempts and blocks the sixth with a Retry-After value", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(() =>
        checkLoginRateLimit("127.0.0.1", "user@example.com"),
      ).not.toThrow();
    }

    try {
      checkLoginRateLimit("127.0.0.1", "user@example.com");
      throw new Error("Expected the sixth attempt to be blocked");
    } catch (error) {
      expect(error).toBeInstanceOf(TooManyRequestsError);
      expect((error as TooManyRequestsError).retryAfter).toBeGreaterThan(0);
    }
  });

  it("tracks separate emails independently", () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      checkLoginRateLimit("127.0.0.1", "first@example.com");
    }

    expect(() =>
      checkLoginRateLimit("127.0.0.1", "second@example.com"),
    ).not.toThrow();
  });
});
