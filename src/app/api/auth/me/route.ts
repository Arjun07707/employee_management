import { ok } from "@/server/http/api-response";
import { UnauthorizedError } from "@/server/http/errors";
import { withApi } from "@/server/http/with-api";
import { getUserById } from "@/server/services/auth.service";
import type { SessionUser } from "@/shared/types/auth";

export const GET = withApi(
  { roles: ["admin", "viewer"] },
  async (_request, { user }) => {
    const session = user as SessionUser;
    const currentUser = await getUserById(session.id);
    if (!currentUser) throw new UnauthorizedError();
    return ok(currentUser);
  },
);
