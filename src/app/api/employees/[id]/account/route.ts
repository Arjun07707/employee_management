import { ok, created } from "@/server/http/api-response";
import { withApi } from "@/server/http/with-api";
import {
  createAccountForEmployee,
  getAccountByEmployee,
  adminUpdateAccount,
} from "@/server/services/account.service";
import {
  createAccountSchema,
  adminUpdateAccountSchema,
} from "@/shared/schemas/account.schema";

export const GET = withApi<{ id: string }>(
  { roles: ["admin"] },
  async (_request, { params }) => ok(await getAccountByEmployee(params.id)),
);

export const POST = withApi<{ id: string }>(
  { roles: ["admin"] },
  async (request, { params, user }) =>
    created(
      await createAccountForEmployee(
        params.id,
        createAccountSchema.parse(await request.json()),
        user!,
      ),
      "Login created successfully",
    ),
);

export const PATCH = withApi<{ id: string }>(
  { roles: ["admin"] },
  async (request, { params }) =>
    ok(
      await adminUpdateAccount(
        params.id,
        adminUpdateAccountSchema.parse(await request.json()),
      ),
      "Account updated successfully",
    ),
);
