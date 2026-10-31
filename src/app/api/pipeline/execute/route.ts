import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { EnterprisePipelineSchema } from "@/lib/contracts/enterprise-types";
import { INITIAL_ENTERPRISE_PIPELINES } from "@/data/enterprise-data";
import { createPipelineExecution } from "@/server/compiler/pipeline-execution-store";

export const dynamic = "force-dynamic";

const ExecuteRequestSchema = z.object({
  pipelineId: z.string().optional(),
  pipeline: EnterprisePipelineSchema.optional(),
  initialInputs: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => Boolean(data.pipeline || data.pipelineId),
  { message: "Either pipeline object or pipelineId must be provided" }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = ExecuteRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid pipeline execution request",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { pipeline: providedPipeline, pipelineId, initialInputs } = parseResult.data;

    let targetPipeline = providedPipeline;
    if (!targetPipeline && pipelineId) {
      targetPipeline = INITIAL_ENTERPRISE_PIPELINES.find((p) => p.id === pipelineId);
    }

    if (!targetPipeline) {
      return NextResponse.json(
        {
          success: false,
          error: `Pipeline with ID "${pipelineId}" not found`,
        },
        { status: 404 }
      );
    }

    const executionRecord = createPipelineExecution(targetPipeline, initialInputs || {});

    return NextResponse.json({
      success: true,
      executionId: executionRecord.executionId,
      streamUrl: `/api/pipeline/stream?id=${executionRecord.executionId}`,
      pipelineId: targetPipeline.id,
      pipelineName: targetPipeline.name,
      status: executionRecord.status,
      nodeCount: targetPipeline.nodes.length,
      totalCostPaise: targetPipeline.totalCostPaise,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Pipeline execution initialization failure";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
