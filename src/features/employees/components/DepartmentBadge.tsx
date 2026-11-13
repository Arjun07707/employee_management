import type { Department } from "@/shared/constants";
import { DEPARTMENT_COLORS } from "@/shared/constants";
import { DotBadge } from "@/components/ui/badge";

export function DepartmentBadge({ department }: { department: Department }) {
  return (
    <DotBadge variant="default" dotClassName="">
      <span
        style={{ color: DEPARTMENT_COLORS[department] }}
        className="font-medium"
      >
        {department}
      </span>
    </DotBadge>
  );
}
