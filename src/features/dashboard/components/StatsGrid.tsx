"use client";

import * as React from "react";
import { Users, CheckCircle2, PauseCircle, Sparkles } from "lucide-react";

import {
  StatCard,
  type StatTone,
} from "@/features/dashboard/components/StatCard";
import { Stagger } from "@/components/motion/Stagger";
import type { DashboardStats } from "@/shared/types/employee";

interface Stat {
  key: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: StatTone;
}
export function StatsGrid({
  stats,
  loading,
}: {
  stats?: DashboardStats;
  loading: boolean;
}) {
  const items: Stat[] = [
    {
      key: "total",
      label: "Total Employees",
      value: stats?.totalEmployees ?? 0,
      icon: Users,
      tone: "primary",
    },
    {
      key: "active",
      label: "Active",
      value: stats?.active ?? 0,
      icon: CheckCircle2,
      tone: "success",
    },
    {
      key: "onLeave",
      label: "Inactive / On Leave",
      value: (stats?.inactive ?? 0) + (stats?.onLeave ?? 0),
      icon: PauseCircle,
      tone: "warning",
    },
    {
      key: "newThisMonth",
      label: "New This Month",
      value: stats?.newThisMonth ?? 0,
      icon: Sparkles,
      tone: "accent",
    },
  ];

  return (
    <Stagger
      as="section"
      aria-label="Key statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      stagger={0.08}
    >
      {items.map((item, index) => (
        <StatCard
          key={item.key}
          label={item.label}
          value={item.value}
          icon={item.icon}
          tone={item.tone}
          index={index + 1}
          loading={loading}
        />
      ))}
    </Stagger>
  );
}
