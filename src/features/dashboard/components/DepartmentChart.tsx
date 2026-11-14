"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { DepartmentStat } from "@/shared/types/employee";
import { formatNumberIN } from "@/lib/format";

interface ChartPayload {
  department: string;
  count: number;
  avgSalary: number;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPayload }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0]!.payload;

  return (
    <div className="rounded-input border border-border bg-surface px-3 py-2 shadow-card-md">
      <p className="text-sm font-semibold text-foreground">{data.department}</p>
      <p className="caption text-muted-foreground">
        <span className="font-mono">{data.count}</span> employee
        {data.count === 1 ? "" : "s"}
      </p>
      <p className="caption text-muted-foreground">
        Avg salary ₹
        <span className="font-mono">{formatNumberIN(data.avgSalary)}</span>
      </p>
    </div>
  );
}

export function DepartmentChart({ data }: { data: DepartmentStat[] }) {
  const chartData = data.map((item) => ({
    department: item.department,
    count: item.count,
    avgSalary: item.avgSalary,
  }));

  const top = data.reduce((m, d, i, a) => (d.count > a[m].count ? i : m), 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Headcount by department</CardTitle>
          <CardDescription>Active employees per department</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              barCategoryGap={12}
            >
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="department"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-30}
                textAnchor="end"
                height={56}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "var(--surface-2)" }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                animationDuration={900}
                maxBarSize={44}
              >
                {chartData.map((d, i) => (
                  <Cell
                    key={d.department}
                    fill={i === top ? "var(--highlight)" : "var(--foreground)"}
                    fillOpacity={i === top ? 1 : 0.88}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
