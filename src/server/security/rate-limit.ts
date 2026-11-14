import "server-only";

import { TooManyRequestsError } from "@/server/http/errors";

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1_000;
const API_LIMIT = 120;
const API_WINDOW_MS = 60 * 1_000;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1_000;

const buckets = new Map<string, number[]>();
let lastCleanup = Date.now();

function cleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, timestamps] of buckets) {
    if (
      timestamps.length === 0 ||
      now - timestamps[timestamps.length - 1]! > API_WINDOW_MS
    ) {
      buckets.delete(key);
    }
  }
}

function hit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  cleanup(now);

  const recent = (buckets.get(key) ?? []).filter(
    (timestamp) => now - timestamp < windowMs,
  );

  if (recent.length >= limit) {
    const oldest = recent[0]!;
    const retryAfter = Math.max(
      1,
      Math.ceil((windowMs - (now - oldest)) / 1_000),
    );
    throw new TooManyRequestsError(retryAfter);
  }

  recent.push(now);
  buckets.set(key, recent);
}

export function checkLoginRateLimit(ip: string, email: string): void {
  hit(
    `login:${ip}:${email.trim().toLowerCase()}`,
    LOGIN_LIMIT,
    LOGIN_WINDOW_MS,
  );
}

export function checkApiRateLimit(ip: string): void {
  hit(`api:${ip}`, API_LIMIT, API_WINDOW_MS);
}

export function enforceRateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): void {
  hit(`rl:${key}`, opts.limit, opts.windowMs);
}

/** Test-only helper so each test starts with an empty limiter. */
export function resetRateLimits(): void {
  buckets.clear();
  lastCleanup = Date.now();
}
