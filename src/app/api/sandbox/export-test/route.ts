import { NextRequest, NextResponse } from "next/server";
import { SandboxExportTestRequestSchema } from "@/lib/contracts/sandbox-types";
import { exportSandboxTestFixture } from "@/server/sandbox/sandbox-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = SandboxExportTestRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          issues: parseResult.error.format(),
          message: "Sandbox test export parameters failed schema validation.",
        },
        { status: 400 }
      );
    }

    const fixture = exportSandboxTestFixture(parseResult.data);
    return NextResponse.json(fixture, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: "SANDBOX_EXPORT_ERROR",
        message,
      },
      { status: 500 }
    );
  }
}
