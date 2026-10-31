import { NextRequest, NextResponse } from "next/server";
import { getComplianceAuditLedger } from "@/server/compliance/policy-engine";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 50;

    const auditLogs = getComplianceAuditLedger(limit);
    const certificates = auditLogs
      .filter((log) => Boolean(log.certificate))
      .map((log) => log.certificate);

    return NextResponse.json({
      success: true,
      count: auditLogs.length,
      auditLogs,
      certificates,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve enterprise compliance audit history",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
