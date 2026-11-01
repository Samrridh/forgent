import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runBusinessDemoWorkflow } from "@/server/compiler/business-workflow-runtime";

const Input = z.strictObject({ task: z.string().trim().min(1).max(4000) });
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Demo workflows are unavailable in production." }, { status: 503 });
  if (Number(request.headers.get("content-length") || 0) > 12000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Workflow not found." }, { status: 404 });
  const input = Input.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Provide a non-empty task of at most 4,000 characters." }, { status: 400 });
  try {
    const result = await runBusinessDemoWorkflow(id, input.data.task);
    return result === null ? NextResponse.json({ error: "This demo workflow has expired or is unavailable." }, { status: 404 }) : NextResponse.json({ result });
  } catch { return NextResponse.json({ error: "A workflow stage did not return a usable response. Its completion is unknown." }, { status: 502 }); }
}
