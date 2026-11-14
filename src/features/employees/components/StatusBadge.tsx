import type { EmployeeStatus } from "@/shared/constants";
import { STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs",
        status === "inactive" ? "text-muted-foreground" : "text-foreground",
      )}
    >
      <span
        aria-hidden="true"
        style={{
          background:
            status === "on_leave"
              ? "conic-gradient(var(--foreground) 0 50%, transparent 0)"
              : status === "active"
                ? "var(--foreground)"
                : "transparent",
          border:
            status === "active" ? "none" : "1.5px solid var(--foreground)",
          opacity: status === "inactive" ? 0.6 : 1,
        }}
        className="size-2 shrink-0 rounded-full"
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
