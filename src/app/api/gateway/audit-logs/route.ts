import { NextRequest, NextResponse } from "next/server";
import {
  AuditLogsQuerySchema,
  GatewayPolicyConfigSchema,
} from "@/lib/contracts/gateway-types";
import { gatewayStore } from "@/server/gateway/gateway-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      limit: searchParams.get("limit") || 50,
      verdict: searchParams.get("verdict") || undefined,
      toolName: searchParams.get("toolName") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const parsed = AuditLogsQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid audit query parameters",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { limit, verdict, toolName, search } = parsed.data;

    const auditLogs = gatewayStore.getAuditRecords({
      limit,
      verdict,
      toolName,
      search,
    });

    const stats = gatewayStore.getStatistics();
    const policy = gatewayStore.getPolicy();

    return NextResponse.json({
      success: true,
      auditLogs,
      stats,
      policy,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve audit records";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a reset action
    if (body.action === "reset") {
      gatewayStore.resetToDefault();
      return NextResponse.json({
        success: true,
        message: "Gateway store reset to default baseline.",
        policy: gatewayStore.getPolicy(),
        stats: gatewayStore.getStatistics(),
      });
    }

    // Otherwise, treat as policy configuration update
    const parsed = GatewayPolicyConfigSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid policy configuration updates",
          issues: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const updatedPolicy = gatewayStore.updatePolicy(parsed.data);

    return NextResponse.json({
      success: true,
      policy: updatedPolicy,
      stats: gatewayStore.getStatistics(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update gateway policy";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
