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
import { DEPARTMENT_COLORS } from "@/shared/constants";
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
        {data.count} employee{data.count === 1 ? "" : "s"}
      </p>
      <p className="caption text-muted-foreground">
        Avg salary ₹{formatNumberIN(data.avgSalary)}
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
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="department"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickLine={false}
                axisLine={{ stroke: "var(--border)" }}
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
                cursor={{ fill: "var(--surface-2)", opacity: 0.6 }}
              />
              <Bar
                dataKey="count"
                radius={[8, 8, 0, 0]}
                animationDuration={900}
                maxBarSize={44}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.department}
                    fill={
                      DEPARTMENT_COLORS[
                        entry.department as keyof typeof DEPARTMENT_COLORS
                      ]
                    }
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
