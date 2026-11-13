import "server-only";

import { DEPARTMENTS, type Department } from "@/shared/constants";
import type { DashboardStats, DepartmentStat } from "@/shared/types/employee";
import { Employee } from "@/server/models/employee.model";
import { toEmployeeDTO, type EmployeeDTOInput } from "@/server/utils/dto";

interface CountBucket {
  count: number;
}

interface DepartmentBucket {
  _id: string;
  count: number;
  avgSalary: number | null;
}

interface StatusBucket {
  _id: string;
  count: number;
}

interface DashboardFacet {
  total: CountBucket[];
  byStatus: StatusBucket[];
  byDepartment: DepartmentBucket[];
  newThisMonth: CountBucket[];
  recent: EmployeeDTOInput[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonthUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const [facet] = await Employee.aggregate<DashboardFacet>([
    { $match: { isDeleted: false } },
    {
      $facet: {
        total: [{ $count: "count" }],
        byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        byDepartment: [
          {
            $group: {
              _id: "$department",
              count: { $sum: 1 },
              avgSalary: { $avg: "$salary" },
            },
          },
          { $sort: { count: -1 } },
        ],
        newThisMonth: [
          { $match: { joiningDate: { $gte: startOfMonthUTC } } },
          { $count: "count" },
        ],
        recent: [{ $sort: { createdAt: -1 } }, { $limit: 5 }],
      },
    },
  ]);

  if (!facet) {
    return {
      totalEmployees: 0,
      active: 0,
      inactive: 0,
      onLeave: 0,
      newThisMonth: 0,
      departmentStats: DEPARTMENTS.map((department) => ({
        department,
        count: 0,
        avgSalary: 0,
      })),
      recentEmployees: [],
    };
  }

  const statusCounts = new Map(
    facet.byStatus.map((bucket) => [bucket._id, bucket.count]),
  );
  const departmentCounts = new Map(
    facet.byDepartment.map((bucket) => [bucket._id, bucket]),
  );

  const departmentStats: DepartmentStat[] = DEPARTMENTS.map((department) => {
    const bucket = departmentCounts.get(department);
    return {
      department: department as Department,
      count: bucket?.count ?? 0,
      avgSalary: Math.round(bucket?.avgSalary ?? 0),
    };
  }).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (
      DEPARTMENTS.indexOf(a.department) - DEPARTMENTS.indexOf(b.department)
    );
  });

  return {
    totalEmployees: facet.total[0]?.count ?? 0,
    active: statusCounts.get("active") ?? 0,
    inactive: statusCounts.get("inactive") ?? 0,
    onLeave: statusCounts.get("on_leave") ?? 0,
    newThisMonth: facet.newThisMonth[0]?.count ?? 0,
    departmentStats,
    recentEmployees: facet.recent.map((document) => toEmployeeDTO(document)),
  };
}
