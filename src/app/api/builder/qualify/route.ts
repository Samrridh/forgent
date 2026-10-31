import { NextRequest, NextResponse } from "next/server";
import {
  QualifyRequestSchema,
  runQualificationSuite,
} from "@/server/builder/qualify-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = QualifyRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          issues: parseResult.error.format(),
          message: "Agent qualification parameters failed schema validation.",
        },
        { status: 400 }
      );
    }

    const report = await runQualificationSuite(parseResult.data);
    return NextResponse.json(report, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: "QUALIFICATION_EXECUTION_ERROR",
        message,
      },
      { status: 500 }
    );
  }
}
