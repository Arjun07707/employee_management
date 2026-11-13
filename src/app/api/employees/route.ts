import { created, paginated } from "@/server/http/api-response";
import { parseJson } from "@/server/http/parse-body";
import { withApi } from "@/server/http/with-api";
import {
  createEmployee,
  listEmployees,
} from "@/server/services/employee.service";
import {
  createEmployeeSchema,
  employeeQuerySchema,
} from "@/shared/schemas/employee.schema";

export const GET = withApi({ roles: ["admin", "viewer"] }, async (request) => {
  const query = employeeQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  const result = await listEmployees(query);
  return paginated(result.items, result.pagination);
});

export const POST = withApi({ roles: ["admin"] }, async (request) => {
  const input = await parseJson(request, createEmployeeSchema);
  const employee = await createEmployee(input);
  return created(employee, "Employee created successfully");
});
