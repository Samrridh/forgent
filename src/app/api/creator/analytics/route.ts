import { NextRequest, NextResponse } from "next/server";
import {
  getCreatorAnalyticsTelemetry,
  CreatorAnalyticsQuerySchema,
} from "@/server/analytics/creator-analytics-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const parsedQuery = CreatorAnalyticsQuerySchema.safeParse({
      timeframe: searchParams.get("timeframe") || "30d",
      creatorId: searchParams.get("creatorId") || "cr_default",
      currency: searchParams.get("currency") || "USD",
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters for creator analytics",
          details: parsedQuery.error.format(),
        },
        { status: 400 }
      );
    }

    const telemetry = getCreatorAnalyticsTelemetry(parsedQuery.data);

    return NextResponse.json(telemetry, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to load creator analytics telemetry", details: message },
      { status: 500 }
    );
  }
}
