import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";
import { EditEmployeeForm } from "@/features/employees/components/EditEmployeeForm";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = { title: "Edit Employee" };

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/employees");

  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Employee"
        description="Update this employee's record."
      />
      <EditEmployeeForm id={id} />
    </div>
  );
}
