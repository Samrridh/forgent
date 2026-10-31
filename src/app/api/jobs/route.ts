import { NextRequest, NextResponse } from "next/server";
import { createJob, updateJobStatus, jobStore, findAgentInCatalog } from "@/server/engine/job-store";
import { lockEscrow } from "@/server/economics/escrow";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentSlug, input } = body;

    if (!agentSlug || typeof agentSlug !== "string") {
      return NextResponse.json(
        { error: "agentSlug is required and must be a string." },
        { status: 400 }
      );
    }

    const agent = findAgentInCatalog(agentSlug);
    if (!agent) {
      return NextResponse.json(
        { error: `Agent with slug "${agentSlug}" not found in catalog.` },
        { status: 404 }
      );
    }

    // 1. Initialize Job in SUBMITTED state
    const job = createJob({
      agentSlug,
      input: input && typeof input === "object" ? input : {},
    });

    // 2. Lock escrow atomically
    await lockEscrow({
      jobId: job.jobId,
      amountPaise: job.budgetPaise,
      amountCents: job.budgetCents,
    });

    // 3. Transition immediately to ESCROW_LOCKED (holding budget in escrow)
    updateJobStatus(
      job.jobId,
      "ESCROW_LOCKED",
      `Escrow reserved: ${job.budgetCents} cents (${job.budgetPaise} paise) locked for execution`
    );

    return NextResponse.json(
      {
        jobId: job.jobId,
        status: job.status,
        agentSlug: job.agentSlug,
        agentTitle: job.title,
        budgetCents: job.budgetCents,
        budgetPaise: job.budgetPaise,
        streamUrl: `/api/jobs/${job.jobId}/stream`,
        createdAt: job.createdAt,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to process job request", details: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const job = jobStore.get(id);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json(job);
  }

  const jobsList = Array.from(jobStore.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json({ jobs: jobsList.slice(0, 50) });
}
