import { clearAuthCookie } from "@/server/auth/cookies";
import { ok } from "@/server/http/api-response";
import { withApi } from "@/server/http/with-api";

export const POST = withApi({}, async () => {
  await clearAuthCookie();
  return ok(null, "Signed out successfully");
});
