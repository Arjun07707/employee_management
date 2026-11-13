"use client";

import * as React from "react";

import { useEmployee } from "@/features/employees/hooks/use-employee";
import { EmployeeForm } from "@/features/employees/components/EmployeeForm";
import { EmployeeDetailsSkeleton } from "@/features/employees/components/EmployeeDetailsSkeleton";
import { EmployeeNotFound } from "@/features/employees/components/EmployeeNotFound";
import { ErrorState } from "@/components/common/ErrorState";

export function EditEmployeeForm({ id }: { id: string }) {
  const { data, isPending, isError, refetch, isFetching } = useEmployee(id);

  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) return <EmployeeNotFound />;

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

  return <EmployeeForm mode="edit" employee={data} />;
}
