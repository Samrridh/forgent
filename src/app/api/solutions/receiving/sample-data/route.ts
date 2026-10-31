import { NextRequest, NextResponse } from "next/server";
import { RECEIVING_SCENARIOS, getReceivingScenarioById } from "@/server/solutions/receiving-scenarios";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const scenarioId = searchParams.get("id");

    if (scenarioId) {
      const scenario = getReceivingScenarioById(scenarioId);
      if (!scenario) {
        return NextResponse.json(
          {
            success: false,
            error: `Scenario with id "${scenarioId}" not found`,
            availableScenarioIds: RECEIVING_SCENARIOS.map((s) => s.id),
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        scenario,
      });
    }

    return NextResponse.json({
      success: true,
      scenarios: RECEIVING_SCENARIOS,
      count: RECEIVING_SCENARIOS.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load receiving sample scenarios";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
