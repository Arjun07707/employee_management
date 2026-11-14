import { setAuthCookie } from "@/server/auth/cookies";
import { ok } from "@/server/http/api-response";
import { parseJson } from "@/server/http/parse-body";
import { withApi } from "@/server/http/with-api";
import { getClientIp } from "@/server/security/ip";
import { checkLoginRateLimit } from "@/server/security/rate-limit";
import { login } from "@/server/services/auth.service";
import { loginSchema } from "@/shared/schemas/account.schema";

export const POST = withApi({}, async (request) => {
  const input = await parseJson(request, loginSchema);

  checkLoginRateLimit(getClientIp(request), input.username);

  const { user, token } = await login(input);
  await setAuthCookie(token);

  const redirectTo =
    user.mustChangePassword
      ? "/account?required=1"
      : user.role === "employee"
        ? "/me"
        : "/dashboard";

  return ok({ ...user, redirectTo }, "Signed in successfully");
});
