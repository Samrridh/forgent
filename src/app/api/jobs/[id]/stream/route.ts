import { NextRequest } from "next/server";
import { jobStore, updateJobStatus, findAgentInCatalog } from "@/server/engine/job-store";
import { executeAgentTask } from "@/server/engine/executor";
import { generateEvidenceReceipt } from "@/server/engine/receipt";
import { settleEscrow, refundEscrow } from "@/server/economics/escrow";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const job = jobStore.get(id);

  if (!job) {
    return new Response(
      JSON.stringify({ error: `Job with ID ${id} not found.` }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const agent = findAgentInCatalog(job.agentSlug);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream might be closed by client
        }
      };

      try {
        // 1. Initial State: SUBMITTED
        sendEvent("job:submitted", {
          jobId: job.jobId,
          status: "SUBMITTED",
          agentSlug: job.agentSlug,
          timestamp: job.createdAt,
        });

        // 2. Escrow Locked
        sendEvent("escrow:locked", {
          jobId: job.jobId,
          status: "ESCROW_LOCKED",
          amountPaise: job.budgetPaise,
          amountCents: job.budgetCents,
          timestamp: new Date().toISOString(),
        });

        // 3. Running State
        updateJobStatus(job.jobId, "RUNNING", "Execution engine started task");
        sendEvent("job:running", {
          jobId: job.jobId,
          status: "RUNNING",
          stage: "DISPATCHING",
          message: "Input validated; dispatching to execution engine",
          timestamp: new Date().toISOString(),
        });

        // 4. Execute Real LLM Task
        const result = await executeAgentTask({
          jobId: job.jobId,
          agentSlug: job.agentSlug,
          agentTitle: agent?.title || job.title,
          agentDescription: agent?.description || job.title,
          inputPayload: job.input,
          onProgress: (step, message) => {
            sendEvent("job:progress", {
              jobId: job.jobId,
              step,
              message,
              timestamp: new Date().toISOString(),
            });
          },
        });

        // 5. Handle Execution Outcome
        if (!result.success) {
          updateJobStatus(job.jobId, "FAILED", result.message);
          job.error = result.message;
          await refundEscrow({ jobId: job.jobId, reason: result.message });

          sendEvent("job:failed", {
            jobId: job.jobId,
            status: "FAILED",
            error: result.error,
            message: result.message,
            diagnostic: result.diagnostic,
            executionLogs: result.executionLogs,
            timestamp: new Date().toISOString(),
          });
          controller.close();
          return;
        }

        // 6. Generate Cryptographic SHA-256 Evidence Receipt
        const receipt = generateEvidenceReceipt({
          jobId: job.jobId,
          agentSlug: job.agentSlug,
          input: job.input,
          systemPrompt: result.systemPrompt,
          executionLogs: result.executionLogs,
          deliverable: {
            summaryMarkdown: result.summaryMarkdown,
            structuredJson: result.structuredJson,
          },
        });

        sendEvent("receipt:generated", {
          receiptId: receipt.receiptId,
          integrityHash: receipt.integrityHash,
          hashScope: receipt.hashScope,
          issuedAt: receipt.issuedAt,
        });

        // 7. Persist Deliverable and Mark Completed
        job.deliverable = {
          summaryMarkdown: result.summaryMarkdown,
          structuredJson: result.structuredJson,
          sha256Receipt: receipt.integrityHash,
          modelUsed: result.modelUsed,
          tokensUsed: result.tokensUsed,
          latencyMs: result.latencyMs,
        };
        job.receipt = receipt;
        updateJobStatus(
          job.jobId,
          "COMPLETED",
          `Completed in ${result.latencyMs}ms using ${result.modelUsed}`
        );

        // 8. Settle Escrow: Split 85% creator payout and 15% platform infrastructure fee
        const settlement = await settleEscrow({
          jobId: job.jobId,
          builderId: agent?.authorName,
          payoutMethod: "STRIPE",
        });

        sendEvent("escrow:settled", {
          settlementId: settlement.settlementId,
          builderAmountPaise: settlement.builderAmountPaise,
          builderAmountCents: settlement.builderAmountCents,
          platformFeePaise: settlement.platformFeePaise,
          platformFeeCents: settlement.platformFeeCents,
          payoutReference: settlement.payoutReference,
          settledAt: settlement.settledAt,
        });

        sendEvent("job:completed", {
          jobId: job.jobId,
          status: "COMPLETED",
          deliverable: job.deliverable,
          receipt,
          settlement,
          latencyMs: result.latencyMs,
          tokensUsed: result.tokensUsed,
          modelUsed: result.modelUsed,
          timestamp: new Date().toISOString(),
        });

        controller.close();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Stream execution error";
        sendEvent("job:failed", {
          jobId: job.jobId,
          status: "FAILED",
          error: "UNEXPECTED_STREAM_ERROR",
          message: errorMsg,
          timestamp: new Date().toISOString(),
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
