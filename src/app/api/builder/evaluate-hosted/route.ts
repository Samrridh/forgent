import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ProposedTestSchema } from "@/server/builder/evaluation/package-review-contract";
import { evaluateHostedCases } from "@/server/builder/evaluation/evaluate-hosted-cases";
import { invokeHostedTask } from "@/server/forgent/hosted-task-agent";
import { runHostedSample } from "@/server/builder/evaluation/hosted-sample";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
import { registerBusinessDemoWorkflow, resolveBusinessWorkflow } from "@/server/compiler/business-workflow-runtime";

const EvaluationRequestSchema = z.strictObject({
  endpointUrl: z.union([z.string().url().max(2048), z.literal("")]),
  hostedRuntime: z.literal("knowledge-support-v1").nullable().default(null),
  approved: z.literal(true),
  cases: z.array(ProposedTestSchema).min(1).max(5),
  agentIds: z.array(z.string().min(1).max(200)).min(1).max(5).optional(),
});

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Evaluation requires production authentication and isolation before it can be enabled." }, { status: 503 });
  const denied = rejectCrossOrigin(request); if (denied) return denied;
  if (Number(request.headers.get("content-length") || 0) > 150000) return NextResponse.json({ error: "Evaluation request is too large." }, { status: 413 });
  const input = EvaluationRequestSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: "Approve one to five valid test cases and provide a test endpoint." }, { status: 400 });
  if (input.data.agentIds && (input.data.endpointUrl || input.data.hostedRuntime)) return NextResponse.json({ error: "Choose a single evaluation target." }, { status: 400 });
  if (!input.data.endpointUrl && !input.data.hostedRuntime && !input.data.agentIds) return NextResponse.json({ error: "Provide a test endpoint; this package has no supported hosted runtime." }, { status: 400 });
  let execute: (task: string) => Promise<string>;
  let fingerprint = "";
  try {
    if (input.data.agentIds) { const workflow = await resolveBusinessWorkflow(input.data.agentIds); execute = workflow.execute; fingerprint = workflow.fingerprint; }
    else execute = (task) => input.data.endpointUrl ? invokeHostedTask(input.data.endpointUrl, task) : runHostedSample(task);
  }
  catch { return NextResponse.json({ error: "This candidate cannot run yet. Every stage needs a supported platform runtime or a published marketplace endpoint." }, { status: 400 }); }
  const finish = (evaluation: Awaited<ReturnType<typeof evaluateHostedCases>>) => ({ ...evaluation, evaluatedAt: new Date().toISOString(), executionMode: input.data.agentIds ? "business_workflow" : input.data.endpointUrl ? "hosted_endpoint" : "platform_sample", ...(input.data.agentIds && evaluation.passed === input.data.cases.length ? { workflowPath: `/api/business/workflows/${registerBusinessDemoWorkflow(input.data.agentIds, fingerprint)}` } : {}) });
  if (request.headers.get("accept")?.includes("text/event-stream")) {
    const encoder = new TextEncoder();
    let closed = false;
    const stream = new ReadableStream({
      async start(controller) {
        const send = (value: unknown) => { if (!closed) controller.enqueue(encoder.encode(`data: ${JSON.stringify(value)}\n\n`)); };
        try {
          const evaluation = await evaluateHostedCases(input.data.cases, execute, (result, completed, total) => send({ type: "progress", result, completed, total }));
          send({ type: "complete", evaluation: finish(evaluation) });
        } catch { send({ type: "error", error: "Evaluation failed." }); }
        finally { if (!closed) controller.close(); }
      },
      cancel() { closed = true; },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
  }
  const evaluation = await evaluateHostedCases(input.data.cases, execute);
  return NextResponse.json({ evaluation: finish(evaluation) });
}
