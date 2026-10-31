import { NextRequest, NextResponse } from "next/server";
import { jobStore } from "@/server/engine/job-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const job = jobStore.get(id);

  if (!job) {
    return NextResponse.json(
      { error: `Job with ID "${id}" not found.` },
      { status: 404 }
    );
  }

  return NextResponse.json(job);
}
