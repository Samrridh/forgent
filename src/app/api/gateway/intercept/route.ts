import { NextRequest, NextResponse } from "next/server";
import { ToolInvocationRequestSchema } from "@/lib/contracts/gateway-types";
import { toolGateway } from "@/server/gateway/tool-gateway";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parsed = ToolInvocationRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid tool invocation payload",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await toolGateway.interceptToolCall(parsed.data);

    // If verdict is BLOCKED, we return HTTP 403 or 200 with result.success: false
    // Returning 200 with result payload allows clients to inspect the structured security audit verdict
    return NextResponse.json(
      {
        success: result.success,
        verdict: result.verdict,
        sanitizedPayload: result.sanitizedPayload,
        redactedKeys: result.redactedKeys,
        redactedCount: result.redactedCount,
        blockedReason: result.blockedReason,
        auditRecord: result.auditRecord,
      },
      { status: result.success ? 200 : 403 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Gateway interception error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
