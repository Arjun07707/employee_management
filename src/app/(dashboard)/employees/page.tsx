"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, UserPlus } from "lucide-react";

import { useEmployeeUrlState } from "@/features/employees/hooks/use-employee-url-state";
import { useEmployeesList } from "@/features/employees/hooks/use-employees-list";
import { EmployeeToolbar } from "@/features/employees/components/EmployeeToolbar";
import { EmployeeTable } from "@/features/employees/components/EmployeeTable";
import { EmployeeCard } from "@/features/employees/components/EmployeeCard";
import { EmployeeTableSkeleton } from "@/features/employees/components/EmployeeTableSkeleton";
import { EmployeeDetailsDialog } from "@/features/employees/components/EmployeeDetailsDialog";
import { DeleteConfirmDialog } from "@/features/employees/components/DeleteConfirmDialog";
import { FilterChips } from "@/features/employees/components/FilterChips";
import { EmptyState } from "@/features/employees/components/EmptyState";
import { Pagination } from "@/features/employees/components/Pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/common/ErrorState";
import { useSession } from "@/providers/session-provider";
import type { Employee } from "@/shared/types/employee";
import type { SortField } from "@/shared/constants";

export default function EmployeesPage() {
  const router = useRouter();
  const user = useSession();
  const state = useEmployeeUrlState();
  const canEdit = user.role === "admin";

  const { data, isPending, isError, refetch, isFetching } = useEmployeesList(
    state.query,
  );

  // Export link carries the active search/filters (not paging).
  const exportHref = React.useMemo(() => {
    const params = new URLSearchParams();
    if (state.search) params.set("search", state.search);
    if (state.department) params.set("department", state.department);
    if (state.status) params.set("status", state.status);
    const qs = params.toString();
    return `/api/employees/export${qs ? `?${qs}` : ""}`;
  }, [state.search, state.department, state.status]);

  const [detailEmployee, setDetailEmployee] = React.useState<Employee | null>(
    null,
  );
  const [deleteEmployee, setDeleteEmployee] = React.useState<Employee | null>(
    null,
  );

  // Key that drives the row entrance animation — only the identity that should
  // re-animate, never the whole data object (rule 5).
  const reanimateKey = `${state.page}|${state.department}|${state.status}|${state.sortBy}|${state.order}|${state.search}`;

  const onRowAction = React.useCallback(
    (action: "view" | "edit" | "delete", employee: Employee) => {
      if (action === "view") setDetailEmployee(employee);
      if (action === "edit") router.push(`/employees/${employee.id}/edit`);
      if (action === "delete") setDeleteEmployee(employee);
    },
    [router],
  );

  const employees = data?.data ?? [];
  const pagination = data?.pagination;
  const isFiltered = state.hasFilters;

  return (
    <div className="space-y-5">
      <PageHeader
        title="All Employees"
        description="Search, filter and manage your team directory."
        meta={
          pagination
            ? `${pagination.total} employee${pagination.total === 1 ? "" : "s"}`
            : undefined
        }
        actions={
          <>
            <Button asChild variant="outline">
              <a href={exportHref} download>
                <Download className="size-4" aria-hidden="true" />
                Export CSV
              </a>
            </Button>
            {canEdit ? (
              <Button asChild>
                <Link href="/employees/new">
                  <UserPlus className="size-4" aria-hidden="true" />
                  Add Employee
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <EmployeeToolbar state={state} />

      <FilterChips
        search={state.search || undefined}
        department={state.department || undefined}
        status={state.status || undefined}
        onRemoveSearch={() => state.setSearch("")}
        onRemoveDepartment={() => state.setDepartment("")}
        onRemoveStatus={() => state.setStatus("")}
      />

      {isError ? (
        <ErrorState
          message="We could not load the employees. Please try again."
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      ) : isPending ? (
        <EmployeeTableSkeleton />
      ) : employees.length === 0 ? (
        <div className="rounded-card border border-border bg-surface shadow-card">
          <EmptyState
            isEmpty={!isFiltered}
            onClearFilters={isFiltered ? state.clearFilters : undefined}
          />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block">
            <EmployeeTable
              employees={employees}
              sortBy={state.sortBy}
              order={state.order}
              onSort={(field: SortField) => state.toggleOrder(field)}
              onRowAction={onRowAction}
              canEdit={canEdit}
              reanimateKey={reanimateKey}
              dimmed={isFetching}
            />
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 lg:hidden">
            {employees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onRowAction={onRowAction}
                canEdit={canEdit}
                reanimateKey={reanimateKey}
              />
            ))}
          </div>

          {pagination ? (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={state.setPage}
            />
          ) : null}
        </>
      )}

      <EmployeeDetailsDialog
        employee={detailEmployee}
        open={Boolean(detailEmployee)}
        onOpenChange={(open) => {
          if (!open) setDetailEmployee(null);
        }}
        canEdit={canEdit}
      />

      <DeleteConfirmDialog
        employee={deleteEmployee}
        open={Boolean(deleteEmployee)}
        onOpenChange={(open) => {
          if (!open) setDeleteEmployee(null);
        }}
      />
    </div>
  );
}
