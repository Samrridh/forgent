import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runHostedSample } from "@/server/builder/evaluation/hosted-sample";

const InputSchema = z.strictObject({ task: z.string().trim().min(1).max(4000) });

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "The demo workflow is unavailable in production." }, { status: 503 });
  if (Number(request.headers.get("content-length") || 0) > 12000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  const input = InputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Provide a non-empty task of at most 4,000 characters." }, { status: 400 });
  try { return NextResponse.json({ result: await runHostedSample(input.data.task) }); }
  catch { return NextResponse.json({ error: "The workflow could not complete this request." }, { status: 500 }); }
}
