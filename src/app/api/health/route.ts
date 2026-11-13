import { NextResponse, connection } from "next/server";

import { connectDB, isDBConnected } from "@/server/db/connect";

export async function GET(): Promise<NextResponse> {
  await connection();

  const base = {
    server: "up" as const,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  try {
    await connectDB();

    if (!isDBConnected()) {
      return NextResponse.json(
        {
          success: false,
          message: "Database unavailable",
          data: { ...base, status: "degraded", database: "disconnected" },
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { ...base, status: "ok", database: "connected" },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Database unavailable",
        data: { ...base, status: "degraded", database: "disconnected" },
      },
      { status: 503 },
    );
  }
}
