import { NextRequest, NextResponse } from "next/server";
import { verifyEvidenceReceipt, EvidenceReceipt } from "@/server/engine/receipt";
import { jobStore } from "@/server/engine/job-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support both direct receipt envelope and flattened parameters
    const receiptToVerify = body.receipt || body;

    if (!receiptToVerify || !receiptToVerify.integrityHash || !receiptToVerify.receiptData) {
      return NextResponse.json(
        {
          valid: false,
          error: "Invalid request payload. Must provide 'integrityHash' and 'receiptData'.",
        },
        { status: 400 }
      );
    }

    const verification = verifyEvidenceReceipt({
      receiptId: receiptToVerify.receiptId,
      integrityHash: receiptToVerify.integrityHash,
      receiptData: receiptToVerify.receiptData,
    });

    return NextResponse.json({
      ...verification,
      receiptId: receiptToVerify.receiptId || `rcpt_${verification.calculatedHash.slice(0, 16)}`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Malformed request";
    return NextResponse.json(
      { valid: false, error: "Failed to parse receipt data", details: message },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const receiptId = searchParams.get("receiptId");
  const jobId = searchParams.get("jobId");
  const hash = searchParams.get("hash");

  if (!receiptId && !jobId && !hash) {
    return NextResponse.json(
      { error: "Provide either hash, receiptId, or jobId query parameter to verify receipt." },
      { status: 400 }
    );
  }

  // Look up receipt from active job store
  let foundReceipt: EvidenceReceipt | undefined;
  let matchedJobId = jobId;

  for (const job of jobStore.values()) {
    if (jobId && (job.jobId === jobId || job.id === jobId)) {
      foundReceipt = job.receipt;
      matchedJobId = job.jobId;
      break;
    }
    if (receiptId && job.receipt?.receiptId === receiptId) {
      foundReceipt = job.receipt;
      matchedJobId = job.jobId;
      break;
    }
    if (
      hash &&
      (job.receipt?.integrityHash?.toLowerCase() === hash.toLowerCase() ||
        job.deliverable?.sha256Receipt?.toLowerCase() === hash.toLowerCase())
    ) {
      foundReceipt = job.receipt;
      matchedJobId = job.jobId;
      break;
    }
  }

  if (!foundReceipt) {
    return NextResponse.json(
      {
        valid: false,
        error: `No evidence receipt found for query parameter: ${hash || receiptId || jobId}`,
      },
      { status: 404 }
    );
  }

  const verification = verifyEvidenceReceipt(foundReceipt);

  return NextResponse.json({
    ...verification,
    receiptId: foundReceipt.receiptId,
    jobId: matchedJobId,
    agentSlug: foundReceipt.agentSlug,
    receipt: foundReceipt,
  });
}
