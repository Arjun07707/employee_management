import type { EmployeeStatus } from "@/shared/constants";
import { DotBadge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

const VARIANTS: Record<EmployeeStatus, "success" | "muted" | "warning"> = {
  active: "success",
  inactive: "muted",
  on_leave: "warning",
};

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <DotBadge
      variant={VARIANTS[status]}
      dotClassName={cn(status === "inactive" && "bg-muted-foreground/60")}
    >
      {STATUS_LABELS[status]}
    </DotBadge>
  );
}
