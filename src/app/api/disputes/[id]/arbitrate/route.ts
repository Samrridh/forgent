import { NextRequest, NextResponse } from "next/server";
import { arbitrateDispute, getDispute } from "@/server/arbitration/oracle-arbiter";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const existing = getDispute(id);
    if (!existing) {
      return NextResponse.json({ error: `Dispute ${id} not found` }, { status: 404 });
    }

    let evaluationPrompt: string | undefined;
    try {
      const body = await request.json();
      if (typeof body?.evaluationPrompt === "string") {
        evaluationPrompt = body.evaluationPrompt;
      }
    } catch {
      // Optional body
    }

    const { dispute, resolution } = await arbitrateDispute(id, evaluationPrompt);

    return NextResponse.json({
      success: true,
      dispute,
      resolution,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Arbitration execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
