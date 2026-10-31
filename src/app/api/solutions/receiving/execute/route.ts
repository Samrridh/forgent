import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ReceivingDocumentBundleSchema,
  ErpBaselineItemSchema,
  CheckpointResolutionSchema,
} from "@/lib/contracts/receiving-types";
import { getReceivingScenarioById } from "@/server/solutions/receiving-scenarios";
import { executeReceivingPipeline } from "@/server/solutions/receiving-engine";

export const dynamic = "force-dynamic";

const ExecuteRequestSchema = z
  .object({
    scenarioId: z.string().optional(),
    documents: ReceivingDocumentBundleSchema.optional(),
    erpBaseline: z.array(ErpBaselineItemSchema).optional(),
    resolution: CheckpointResolutionSchema.optional(),
    stream: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.scenarioId || data.documents), {
    message: "Either scenarioId or custom documents bundle must be provided",
  });

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = ExecuteRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid receiving pipeline execution request",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { scenarioId, documents: providedDocs, erpBaseline: providedBaseline, resolution, stream: requestedStream } =
      parseResult.data;

    let targetDocs = providedDocs;
    let targetBaseline = providedBaseline || [];

    if (scenarioId) {
      const scenario = getReceivingScenarioById(scenarioId);
      if (!scenario) {
        return NextResponse.json(
          {
            success: false,
            error: `Scenario with ID "${scenarioId}" not found`,
          },
          { status: 404 }
        );
      }
      if (!targetDocs) {
        targetDocs = scenario.documents;
      }
      if (targetBaseline.length === 0) {
        targetBaseline = scenario.erpBaseline;
      }
    }

    if (!targetDocs) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid receiving documents available for pipeline execution",
        },
        { status: 400 }
      );
    }

    const wantsStream =
      requestedStream === true || req.headers.get("accept")?.includes("text/event-stream");

    // SSE Streaming Execution
    if (wantsStream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          const sendEvent = (event: string, data: unknown) => {
            try {
              const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
              controller.enqueue(encoder.encode(payload));
            } catch (err) {
              console.error("Error enqueuing SSE event", err);
            }
          };

          try {
            sendEvent("pipeline-start", {
              timestamp: new Date().toISOString(),
              poNumber: targetDocs?.purchaseOrder.poNumber,
              vendorName: targetDocs?.purchaseOrder.vendorName,
            });

            const result = await executeReceivingPipeline({
              documents: targetDocs!,
              erpBaseline: targetBaseline,
              resolution,
              onProgress: (prog) => {
                if (prog.status === "START") {
                  sendEvent("stage-start", { stage: prog.stage });
                } else if (prog.status === "COMPLETE") {
                  sendEvent("stage-complete", {
                    stage: prog.stage,
                    data: prog.data,
                  });
                }
              },
            });

            if (result.checkpoint) {
              sendEvent("checkpoint-emitted", { checkpoint: result.checkpoint });
            }

            sendEvent("erp-diff", { diff: result.erpStateDiff });
            sendEvent("receipt-sealed", { receipt: result.sealedReceipt });
            sendEvent("pipeline-complete", { result });
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Pipeline execution failed";
            sendEvent("pipeline-error", { error: message });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Synchronous JSON Execution
    const result = await executeReceivingPipeline({
      documents: targetDocs,
      erpBaseline: targetBaseline,
      resolution,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Receiving execution initialization failure";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
