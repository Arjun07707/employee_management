import type { EmployeeStatus } from "@/shared/constants";

/** ₹ 12,50,000 — Indian digit grouping. */
export function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** 12,50,000 — no symbol, for compact stat captions. */
export function formatNumberIN(value: number): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    value,
  );
}

/** 12 Mar 2024 */
export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** 29 October 2026 */
export function formatLongDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** yyyy-MM-dd for <input type="date"> values. */
export function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

/** "2 yrs 3 mos" */
export function tenure(from: string | Date, to: Date = new Date()): string {
  const start = typeof from === "string" ? new Date(from) : from;
  if (Number.isNaN(start.getTime())) return "—";

  let months =
    (to.getFullYear() - start.getFullYear()) * 12 +
    (to.getMonth() - start.getMonth());
  if (to.getDate() < start.getDate()) months -= 1;

  if (months < 0) return "—";

  const years = Math.floor(months / 12);
  const rest = months % 12;

  if (years === 0) return `${rest} mo`;
  if (rest === 0) return `${years} yr${years > 1 ? "s" : ""}`;
  return `${years} yr${years > 1 ? "s" : ""} ${rest} mo`;
}

export const STATUS_LABELS: Record<EmployeeStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
};

export function greetingForHour(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
