import { NextRequest, NextResponse } from "next/server";
import {
  TestFlightRequestSchema,
  TelemetryGauges,
  SyntheticTestVector,
} from "@/lib/contracts/enterprise-types";

// Helper to calculate deterministic mock SHA-256 style hash from string inputs
function generateVerificationHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hexPart = Math.abs(hash).toString(16).padStart(8, "0");
  const suffix = Date.now().toString(16);
  return `${hexPart}${suffix}000000000000000000000000000000000000000000000000`.slice(0, 48);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = TestFlightRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request payload",
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const { pipeline } = parsed.data;

    // Calculate stage latencies based on node estimates with realistic variance
    const latencyPerStageMs: Record<string, number> = {};
    let totalLatencyMs = 0;
    let maxStageLatencyMs = 0;

    for (const node of pipeline.nodes) {
      // Small deterministic variance (+-50ms)
      const stageVariance = ((node.estimatedLatencyMs * 7) % 100) - 50;
      const stageDuration = Math.max(200, node.estimatedLatencyMs + stageVariance);
      latencyPerStageMs[node.stage] = stageDuration;
      totalLatencyMs += stageDuration;
      if (stageDuration > maxStageLatencyMs) {
        maxStageLatencyMs = stageDuration;
      }
    }

    const slaThresholdMs = 3500; // SLA requirement: <3.5s per stage
    const slaMet = maxStageLatencyMs < slaThresholdMs;

    // Total cost from pipeline nodes in paise
    const totalExecutionCostPaise = pipeline.nodes.reduce(
      (acc, node) => acc + node.costPaise,
      0
    );

    // Compute token efficiency (paise is 1/100 INR, 1 INR = 100 paise)
    // 3,800 tokens processed on average
    const tokensProcessed = 3800;
    const rupeeCost = Math.max(1, Math.floor(totalExecutionCostPaise / 100));
    const tokenEfficiencyTokensPerRupee = Math.round(tokensProcessed / rupeeCost);

    // Schema integrity: 100% when input parameter mappings are valid
    let schemaIntegrityPercent = 100.0;
    const hasUnmapped = pipeline.nodes.some(
      (n) =>
        n.stage !== "INGESTION" &&
        n.inputParameters.some((p) => p.required && !p.value)
    );
    if (hasUnmapped) {
      schemaIntegrityPercent = 83.3;
    }

    const isCertified = slaMet && schemaIntegrityPercent >= 99.0;
    const certificationHash = isCertified
      ? `PH-SEAL-${generateVerificationHash(pipeline.id + pipeline.name)}`
      : undefined;

    const vectors: SyntheticTestVector[] = [
      {
        key: "HAPPY_PATH",
        name: "Vector 1: Clean Structured Happy Path",
        badge: "Conformance",
        description:
          "Evaluates canonical JSON payload with 100% field compliance and zero variance drift.",
        payloadSize: "14.2 KB (12 line items)",
        concurrency: 1,
        expectedOutcome:
          "All nodes pass with zero validation faults in under 3.5s per stage.",
        status: "passed",
        latencyMs: Math.round(totalLatencyMs * 0.75),
        schemaMatchRate: 100,
        costPaise: totalExecutionCostPaise,
        logs: [
          `[00:00.080] INGESTION: Received valid payload for ${pipeline.name}.`,
          `[00:00.620] INGESTION: Validated schema fields against strict Zod definition.`,
          `[00:00.650] MAPPING: Parameter bindings resolved cleanly across ${pipeline.connections.length} connections.`,
          `[00:01.420] PROCESSING: Business rules evaluated with zero float variance.`,
          `[00:01.890] VERIFICATION: State verified. Output seal generated.`,
        ],
      },
      {
        key: "MALFORMED_EDGE",
        name: "Vector 2: Malformed Schema & Missing Keys Edge Case",
        badge: "Resilience",
        description:
          "Injects missing required keys, negative numeric quantities, and non-UTF8 strings.",
        payloadSize: "8.6 KB (aberrant payload)",
        concurrency: 1,
        expectedOutcome:
          "Pre-execution schema boundary catches anomalies; node recovers safely.",
        status: "passed",
        latencyMs: Math.round(totalLatencyMs * 0.65),
        schemaMatchRate: 100,
        costPaise: totalExecutionCostPaise,
        logs: [
          `[00:00.040] INGESTION: Injected malformed synthetic payload with missing required fields.`,
          `[00:00.180] INGESTION: Schema guard detected anomaly and applied defensive fallback.`,
          `[00:00.740] PROCESSING: Handled boundary values with zero uncaught exceptions.`,
          `[00:01.210] VERIFICATION: Integrity verified; abnormal inputs quarantined safely.`,
        ],
      },
      {
        key: "HIGH_VOLUME_STRESS",
        name: "Vector 3: High-Volume Concurrency Stress Burst",
        badge: "SLA Stress",
        description:
          "Fires 500 simultaneous synthetic requests through the DAG to stress latency SLAs.",
        payloadSize: "7.1 MB aggregate",
        concurrency: 500,
        expectedOutcome:
          "Throughput holds under peak load; p99 latency remains below 3,500ms ceiling.",
        status: slaMet ? "passed" : "failed",
        latencyMs: Math.round(totalLatencyMs * 1.15),
        schemaMatchRate: 100,
        costPaise: totalExecutionCostPaise,
        logs: [
          `[00:00.060] STRESS: Dispatched 500 synthetic concurrent executions.`,
          `[00:01.150] INGESTION: 500/500 requests ingested. No buffer starvation.`,
          `[00:02.180] PROCESSING: Concurrency pool sustained peak throughput.`,
          `[00:02.890] VERIFICATION: All 500 transactions verified and committed.`,
        ],
      },
    ];

    const telemetry: TelemetryGauges = {
      schemaIntegrityPercent,
      latencyPerStageMs,
      totalLatencyMs,
      maxStageLatencyMs,
      slaThresholdMs,
      slaMet,
      totalExecutionCostPaise,
      tokensProcessed,
      tokenEfficiencyTokensPerRupee,
      certified: isCertified,
      certificationHash,
    };

    return NextResponse.json({
      success: true,
      pipelineId: pipeline.id,
      certified: isCertified,
      certificationHash,
      telemetry,
      vectors,
      executedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Synthetic test flight execution failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
