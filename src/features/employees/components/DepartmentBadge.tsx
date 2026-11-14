import type { Department } from "@/shared/constants";

export function DepartmentBadge({ department }: { department: Department }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-transparent px-2.5 py-1 text-xs font-medium text-foreground">
      {department}
    </span>
  );
}
