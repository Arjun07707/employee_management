import "server-only";

/**
 * Recursively removes keys that could be interpreted as MongoDB operators
 * (`$where`, `$gt`, ...) or as dotted paths (`profile.role`).
 */
export function sanitize<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item)) as T;
  }

  if (value !== null && typeof value === "object" && !(value instanceof Date)) {
    const clean: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = sanitize(item);
    }
    return clean as T;
  }

  return value;
}
