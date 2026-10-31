import { NextRequest, NextResponse } from "next/server";
import {
  queryLeaderboard,
  getAgentLeaderboardBySlug,
  verifyAgentBenchmarkReceipt,
  LeaderboardQuerySchema,
} from "@/server/analytics/leaderboard-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Single agent lookup mode
    const slug = searchParams.get("slug");
    const verifyReceipt = searchParams.get("verifyReceipt") === "true";

    if (slug) {
      if (verifyReceipt) {
        const verification = verifyAgentBenchmarkReceipt(slug);
        if (!verification.valid && !verification.receiptHash) {
          return NextResponse.json(
            { error: `Agent with slug "${slug}" not found in benchmark catalog` },
            { status: 404 }
          );
        }
        return NextResponse.json(verification, { status: 200 });
      }

      const agent = getAgentLeaderboardBySlug(slug);
      if (!agent) {
        return NextResponse.json(
          { error: `Agent with slug "${slug}" not found in benchmark catalog` },
          { status: 404 }
        );
      }
      return NextResponse.json({ agent }, { status: 200 });
    }

    // Leaderboard query mode
    const parsedQuery = LeaderboardQuerySchema.safeParse({
      domain: searchParams.get("domain") || "ALL",
      search: searchParams.get("search") || "",
      sortBy: searchParams.get("sortBy") || "rank",
      order: searchParams.get("order") || "asc",
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 25,
      minTrustIndex: searchParams.get("minTrustIndex") || undefined,
    });

    if (!parsedQuery.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters for leaderboard",
          details: parsedQuery.error.format(),
        },
        { status: 400 }
      );
    }

    const leaderboard = queryLeaderboard(parsedQuery.data);

    return NextResponse.json(leaderboard, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: "Failed to load leaderboard data", details: message },
      { status: 500 }
    );
  }
}
