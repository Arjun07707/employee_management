import { ok } from "@/server/http/api-response";
import { UnauthorizedError } from "@/server/http/errors";
import { withApi } from "@/server/http/with-api";
import { getUserById } from "@/server/services/auth.service";

export const GET = withApi(
  { roles: ["admin", "viewer", "employee"], allowMustChange: true },
  async (_request, { user }) => {
    if (!user) throw new UnauthorizedError();
    const currentUser = await getUserById(user.id);
    if (!currentUser) throw new UnauthorizedError();
    return ok(currentUser);
  },
);
