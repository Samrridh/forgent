import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  fileDispute,
  listDisputes,
  DisputeReasonCategory,
  DisputeStatus,
} from "@/server/arbitration/oracle-arbiter";

const CreateDisputeSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  category: z.enum([
    "SCHEMA_FAILURE",
    "INVENTORY_DISCREPANCY",
    "UNFULFILLED_CRITERIA",
    "CORRUPTED_DELIVERABLE",
    "LATENCY_SLA_BREACH",
    "OTHER",
  ]),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  complainantId: z.string().optional(),
  claimedDeliverableHash: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as DisputeStatus | null;
    const jobId = searchParams.get("jobId") || undefined;

    const disputes = listDisputes({
      status: status || undefined,
      jobId,
    });

    const all = listDisputes();
    const pendingCount = all.filter((d) => d.status === "PENDING_ARBITRATION").length;
    const resolvedCount = all.filter((d) => d.status === "RESOLVED").length;

    return NextResponse.json({
      disputes,
      total: disputes.length,
      pendingCount,
      resolvedCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retrieve disputes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateDisputeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid dispute submission payload",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const dispute = await fileDispute({
      jobId: parsed.data.jobId,
      category: parsed.data.category as DisputeReasonCategory,
      title: parsed.data.title,
      description: parsed.data.description,
      complainantId: parsed.data.complainantId,
      claimedDeliverableHash: parsed.data.claimedDeliverableHash,
    });

    return NextResponse.json(
      {
        success: true,
        dispute,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to file dispute";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
