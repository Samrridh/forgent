import { NextResponse } from "next/server";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const timestamp = new Date().toISOString();
  
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1 as alive`;
    const latencyMs = Date.now() - start;

    return NextResponse.json(
      {
        status: "ok",
        version: "0.1.0",
        timestamp,
        checks: {
          application: "ok",
          database: "ok",
        },
        metrics: {
          dbLatencyMs: latencyMs,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Health check database failure:", error instanceof Error ? error.message : "Unknown error");
    
    return NextResponse.json(
      {
        status: "degraded",
        version: "0.1.0",
        timestamp,
        checks: {
          application: "ok",
          database: "error",
        },
        error: "Database connectivity check failed",
      },
      { status: 503 }
    );
  }
}
