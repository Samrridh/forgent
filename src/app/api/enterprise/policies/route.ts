import { NextRequest, NextResponse } from "next/server";
import {
  EnterprisePolicyConfigSchema,
} from "@/lib/contracts/compliance-types";
import {
  getActivePolicy,
  updateActivePolicy,
  resetPolicyToDefaults,
} from "@/server/compliance/policy-engine";

export async function GET() {
  try {
    const policy = getActivePolicy();
    return NextResponse.json({
      success: true,
      policy,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load active enterprise governance policy",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body && typeof body === "object" && "action" in body && body.action === "reset") {
      const resetPolicy = resetPolicyToDefaults();
      return NextResponse.json({
        success: true,
        message: "Enterprise governance policy reset to baseline defaults",
        policy: resetPolicy,
      });
    }

    const parsed = EnterprisePolicyConfigSchema.partial().safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid enterprise policy payload",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const updatedPolicy = updateActivePolicy(parsed.data);

    return NextResponse.json({
      success: true,
      message: "Enterprise governance policy successfully updated and enforced",
      policy: updatedPolicy,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to persist enterprise policy update",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
