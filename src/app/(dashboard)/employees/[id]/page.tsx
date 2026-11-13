"use client";

import * as React from "react";
import { useParams } from "next/navigation";

import { useEmployee } from "@/features/employees/hooks/use-employee";
import { EmployeeDetails } from "@/features/employees/components/EmployeeDetails";
import { DeleteConfirmDialog } from "@/features/employees/components/DeleteConfirmDialog";
import { EmployeeDetailsSkeleton } from "@/features/employees/components/EmployeeDetailsSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { EmployeeNotFound } from "@/features/employees/components/EmployeeNotFound";
import { useSession } from "@/providers/session-provider";

export default function EmployeeDetailsPage() {
  const user = useSession();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const canEdit = user.role === "admin";

  const { data, isPending, isError, refetch, isFetching } = useEmployee(id);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return <EmployeeNotFound />;
  }

  if (isPending) return <EmployeeDetailsSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="We could not load this employee"
        message="The record may have been removed, or the request failed."
        onRetry={() => void refetch()}
        retrying={isFetching}
      />
    );
  }

  if (!data) return <EmployeeNotFound />;

  return (
    <>
      <EmployeeDetails
        employee={data}
        canEdit={canEdit}
        onDelete={() => setConfirmDelete(true)}
      />
      <DeleteConfirmDialog
        employee={data}
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
      />
    </>
  );
}
