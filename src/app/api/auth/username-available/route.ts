import { ok } from "@/server/http/api-response";
import { withApi, enforceRateLimit } from "@/server/http/with-api";
import { checkUsernameAvailability, getAccountUserIdByEmployee } from "@/server/services/account.service";

export const GET = withApi(
  { roles: ["admin", "employee"], allowMustChange: true },
  async (request, { user }) => {
    enforceRateLimit(`uname:${user!.id}`, { limit: 40, windowMs: 60_000 });

    const username = request.nextUrl.searchParams.get("username") ?? "";
    const forEmployee = request.nextUrl.searchParams.get("forEmployee");

    let excludeUserId: string | undefined;
    if (user!.role === "employee") {
      excludeUserId = user!.id;
    } else if (user!.role === "admin" && forEmployee) {
      excludeUserId = (await getAccountUserIdByEmployee(forEmployee)) ?? undefined;
    }

    const res = ok(await checkUsernameAvailability(username.slice(0, 64), { excludeUserId }));
    res.headers.set("Cache-Control", "no-store");
    return res;
  },
);
