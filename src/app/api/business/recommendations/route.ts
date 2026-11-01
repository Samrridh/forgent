import { NextRequest, NextResponse } from "next/server";
import { BusinessRequestSchema } from "@/server/compiler/business-compiler-contracts";
import { listCompilerAgents } from "@/server/compiler/business-agent-catalog";
import { compileBusinessRequest } from "@/server/compiler/business-compiler";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Business recommendations require production authentication before they can be enabled." }, { status: 503 });
  const input = BusinessRequestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Provide an objective of at least 10 characters and valid requirements." }, { status: 400 });
  const { agents, source, fallbackReason } = await listCompilerAgents();
  const result = await compileBusinessRequest(input.data, agents);
  if (source === "seed") result.notices.push(fallbackReason === "unavailable" ? "Database unavailable; using seeded demo agents." : "No eligible agents or published listings are in the database; using seeded demo agents.");
  return NextResponse.json(result);
}
