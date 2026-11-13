import { setAuthCookie } from "@/server/auth/cookies";
import { ok } from "@/server/http/api-response";
import { parseJson } from "@/server/http/parse-body";
import { withApi } from "@/server/http/with-api";
import { getClientIp } from "@/server/security/ip";
import { checkLoginRateLimit } from "@/server/security/rate-limit";
import { login } from "@/server/services/auth.service";
import { loginSchema } from "@/shared/schemas/auth.schema";

export const POST = withApi({}, async (request) => {
  const input = await parseJson(request, loginSchema);

  checkLoginRateLimit(getClientIp(request), input.email);

  const { user, token } = await login(input.email, input.password);
  await setAuthCookie(token);

  return ok(user, "Signed in successfully");
});
