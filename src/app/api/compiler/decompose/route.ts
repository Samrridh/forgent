import { NextRequest, NextResponse } from "next/server";
import {
  autoCompileWorkflow,
  AutoCompileRequestSchema,
} from "@/server/compiler/auto-compiler";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = AutoCompileRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid decomposition request payload",
          details: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const compileResult = await autoCompileWorkflow(parseResult.data);

    return NextResponse.json({
      success: true,
      pipeline: compileResult.pipeline,
      reasoning: compileResult.reasoning,
      matchedAgents: compileResult.matchedAgents,
      compilerMode: compileResult.compilerMode,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal compiler decomposition error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
