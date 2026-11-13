import { ok } from "@/server/http/api-response";
import { parseJson } from "@/server/http/parse-body";
import { withApi } from "@/server/http/with-api";
import {
  deleteEmployee,
  getEmployeeById,
  updateEmployee,
} from "@/server/services/employee.service";
import { updateEmployeeSchema } from "@/shared/schemas/employee.schema";

export const GET = withApi<{ id: string }>(
  { roles: ["admin", "viewer"] },
  async (_request, { params }) => ok(await getEmployeeById(params.id)),
);

export const PATCH = withApi<{ id: string }>(
  { roles: ["admin"] },
  async (request, { params }) => {
    const input = await parseJson(request, updateEmployeeSchema);
    return ok(
      await updateEmployee(params.id, input),
      "Employee updated successfully",
    );
  },
);

export const DELETE = withApi<{ id: string }>(
  { roles: ["admin"] },
  async (_request, { params }) => {
    await deleteEmployee(params.id);
    return ok(null, "Employee deleted successfully");
  },
);
