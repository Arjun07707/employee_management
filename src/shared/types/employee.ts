import type { Department, EmployeeStatus } from "@/shared/constants";

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  designation: string;
  salary: number;
  joiningDate: string;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentStat {
  department: Department;
  count: number;
  avgSalary: number;
}

export interface DashboardStats {
  totalEmployees: number;
  active: number;
  inactive: number;
  onLeave: number;
  newThisMonth: number;
  departmentStats: DepartmentStat[];
  recentEmployees: Employee[];
}
