import { NextRequest, NextResponse } from "next/server";
import { BusinessRequestSchema } from "@/server/compiler/business-compiler-contracts";
import { listCompilerAgents } from "@/server/compiler/business-agent-catalog";
import { compileBusinessRequest } from "@/server/compiler/business-compiler";
import { rejectCrossOrigin } from "@/server/forgent/console-request";

export async function POST(request: NextRequest) {
  const denied = rejectCrossOrigin(request); if (denied) return denied;
  if (Number(request.headers.get("content-length") || 0) > 250000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  const input = BusinessRequestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Provide an objective of at least 10 characters and valid requirements." }, { status: 400 });
  try {
    const { agents, source, fallbackReason } = await listCompilerAgents();
    const result = await compileBusinessRequest(input.data, agents);
    if (source === "seed") result.notices.push(fallbackReason === "unavailable" ? "Database unavailable; using seeded demo agents." : "No eligible agents or published listings are in the database; using seeded demo agents.");
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not load the agent catalog. Please try again." }, { status: 503 });
  }
}
