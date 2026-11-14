import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/server/auth/session";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmployeeForm } from "@/features/employees/components/EmployeeForm";

export const metadata: Metadata = { title: "Add Employee" };
export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "admin") redirect("/employees");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Employee"
        description="Create a new employee record in the directory."
      />
      <EmployeeForm mode="create" />
    </div>
  );
}
