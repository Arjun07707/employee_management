import { NextResponse } from "next/server";

import { withApi } from "@/server/http/with-api";
import { exportEmployeesCsv } from "@/server/services/employee.service";
import { employeeQuerySchema } from "@/shared/schemas/employee.schema";

export const GET = withApi({ roles: ["admin", "viewer"] }, async (request) => {
  const query = employeeQuerySchema.parse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  const { csv, filename } = await exportEmployeesCsv(query);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
