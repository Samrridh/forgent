import { NextRequest, NextResponse } from "next/server";
import { getDispute } from "@/server/arbitration/oracle-arbiter";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const dispute = getDispute(id);

    if (!dispute) {
      return NextResponse.json({ error: `Dispute ${id} not found` }, { status: 404 });
    }

    return NextResponse.json({ dispute });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve dispute";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
