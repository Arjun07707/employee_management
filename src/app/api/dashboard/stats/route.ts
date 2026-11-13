import { ok } from "@/server/http/api-response";
import { withApi } from "@/server/http/with-api";
import { getDashboardStats } from "@/server/services/dashboard.service";

export const GET = withApi({ roles: ["admin", "viewer"] }, async () =>
  ok(await getDashboardStats()),
);
