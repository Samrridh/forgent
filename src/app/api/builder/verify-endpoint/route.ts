import { NextRequest, NextResponse } from "next/server";
import {
  VerifyEndpointInputSchema,
  verifyRemoteEndpoint,
} from "@/server/builder/endpoint-verifier";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = VerifyEndpointInputSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "VALIDATION_ERROR",
          issues: parseResult.error.format(),
          message: "Invalid endpoint verification request parameters.",
        },
        { status: 400 }
      );
    }

    const result = await verifyRemoteEndpoint(parseResult.data);
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ERROR",
        message,
      },
      { status: 500 }
    );
  }
}
