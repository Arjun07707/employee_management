"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";

import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard-stats";
import { StatsGrid } from "@/features/dashboard/components/StatsGrid";
import { DepartmentBreakdown } from "@/features/dashboard/components/DepartmentBreakdown";
import { RecentEmployees } from "@/features/dashboard/components/RecentEmployees";
import { DashboardSkeleton } from "@/features/dashboard/components/DashboardSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { useSession } from "@/providers/session-provider";
import { greetingForHour, formatLongDate } from "@/lib/format";

// Recharts is client-only and heavy: load it dynamically with ssr:false so it
// never blocks the server render or the initial bundle (plan §1.10).
const DepartmentChart = dynamic(
  () =>
    import("@/features/dashboard/components/DepartmentChart").then(
      (module) => module.DepartmentChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-card border border-border bg-surface p-5 shadow-card">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
        <Skeleton className="mt-6 h-[280px] w-full" />
      </div>
    ),
  },
);

export default function DashboardPage() {
  const user = useSession();
  const { data, isPending, isError, refetch, isFetching } = useDashboardStats();

  const isEmpty = !isPending && (data?.totalEmployees ?? 0) === 0;

  if (isPending) return <DashboardSkeleton />;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <ErrorState
          message="We could not load the dashboard statistics."
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greetingForHour()}, ${user.name.split(" ")[0]}`}
        description={formatLongDate(new Date())}
        actions={
          <Button asChild>
            <Link href="/employees/new">
              <Plus className="size-4" aria-hidden="true" />
              Add Employee
            </Link>
          </Button>
        }
      />

      {isEmpty ? (
        <div className="rounded-card border border-dashed border-border bg-surface p-12 text-center">
          <p className="section-title text-foreground">Welcome aboard 👋</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add your first employee to start seeing live statistics here.
          </p>
          <Button asChild className="mt-5">
            <Link href="/employees/new">
              <Plus className="size-4" aria-hidden="true" />
              Add your first employee
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <StatsGrid stats={data} loading={false} />

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <DepartmentChart data={data?.departmentStats ?? []} />
            </div>
            <DepartmentBreakdown data={data?.departmentStats ?? []} />
          </section>

          <RecentEmployees employees={data?.recentEmployees ?? []} />
        </>
      )}
    </div>
  );
}
