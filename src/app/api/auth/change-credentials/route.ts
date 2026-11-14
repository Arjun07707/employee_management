import { ok } from "@/server/http/api-response";
import { withApi, enforceRateLimit } from "@/server/http/with-api";
import { setAuthCookie } from "@/server/auth/cookies";
import { changeOwnCredentials } from "@/server/services/account.service";
import { changeCredentialsSchema } from "@/shared/schemas/account.schema";

export const POST = withApi(
  { roles: ["admin", "employee", "viewer"], allowMustChange: true },
  async (request, { user }) => {
    enforceRateLimit(`chg:${user!.id}`, { limit: 5, windowMs: 15 * 60_000 });

    const { user: updated, token } = await changeOwnCredentials(
      user!.id,
      changeCredentialsSchema.parse(await request.json()),
    );

    const res = ok(updated, "Credentials updated successfully");
    await setAuthCookie(token);
    return res;
  },
);
