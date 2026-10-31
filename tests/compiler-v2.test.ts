import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  autoCompileWorkflow,
  heuristicSelectAgents,
  AutoCompileRequestSchema,
} from "@/server/compiler/auto-compiler";
import {
  EnterprisePipelineSchema,
  EnterprisePipeline,
} from "@/lib/contracts/enterprise-types";
import {
  createPipelineExecution,
  getPipelineExecution,
} from "@/server/compiler/pipeline-execution-store";
import { POST as decomposeHandler } from "@/app/api/compiler/decompose/route";
import { POST as executeHandler } from "@/app/api/pipeline/execute/route";
import { GET as streamHandler } from "@/app/api/pipeline/stream/route";
import { computeReceiptHash } from "@/server/engine/receipt";

describe("Autonomous Team Compiler v2 & Live DAG Canvas Orchestration", () => {
  describe("Backend Compiler Engine (auto-compiler.ts)", () => {
    it("decomposes natural language market analysis request into a valid 3-stage EnterprisePipeline", async () => {
      const prompt =
        "Conduct a thorough market competitor analysis and draft an executive financial summary";
      const result = await autoCompileWorkflow({ prompt, maxStages: 3 });

      expect(result.pipeline).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.matchedAgents).toHaveLength(3);

      // Verify schema conformance
      const parseResult = EnterprisePipelineSchema.safeParse(result.pipeline);
      expect(parseResult.success, "Compiled pipeline failed schema validation").toBe(true);

      // Verify stage sequence
      const stages = result.pipeline.nodes.map((n) => n.stage);
      expect(stages[0]).toBe("INGESTION");
      expect(stages[1]).toBe("PROCESSING");
      expect(stages[2]).toBe("VERIFICATION");

      // Verify monetary precision in integer paise
      expect(Number.isInteger(result.pipeline.totalCostPaise)).toBe(true);
      expect(result.pipeline.totalCostPaise).toBeGreaterThan(0);

      const calculatedNodeSum = result.pipeline.nodes.reduce(
        (acc, n) => acc + n.costPaise,
        0
      );
      expect(result.pipeline.totalCostPaise).toBe(calculatedNodeSum);

      // Verify parameter pipes / connections
      expect(result.pipeline.connections).toHaveLength(2);
      expect(result.pipeline.connections[0].fromNodeId).toBe(result.pipeline.nodes[0].id);
      expect(result.pipeline.connections[0].toNodeId).toBe(result.pipeline.nodes[1].id);
      expect(result.pipeline.connections[1].fromNodeId).toBe(result.pipeline.nodes[1].id);
      expect(result.pipeline.connections[1].toNodeId).toBe(result.pipeline.nodes[2].id);

      // Node 2 has mappedFrom binding pointing to Node 1
      expect(result.pipeline.nodes[1].inputParameters[0].mappedFrom).toBeDefined();
      expect(result.pipeline.nodes[1].inputParameters[0].mappedFrom?.nodeId).toBe(
        result.pipeline.nodes[0].id
      );

      // Node 3 has mappedFrom binding pointing to Node 2
      expect(result.pipeline.nodes[2].inputParameters[0].mappedFrom).toBeDefined();
      expect(result.pipeline.nodes[2].inputParameters[0].mappedFrom?.nodeId).toBe(
        result.pipeline.nodes[1].id
      );
    });

    it("supports dynamic stage scaling (2 stages and 4 stages)", async () => {
      // 2 stages
      const res2 = await autoCompileWorkflow({
        prompt: "Quick audit of cloud infrastructure spend",
        maxStages: 2,
      });
      expect(res2.pipeline.nodes).toHaveLength(2);
      expect(res2.pipeline.connections).toHaveLength(1);

      // 4 stages
      const res4 = await autoCompileWorkflow({
        prompt: "Enterprise healthcare HIPAA compliance and audit report pipeline",
        maxStages: 4,
      });
      expect(res4.pipeline.nodes).toHaveLength(4);
      expect(res4.pipeline.connections).toHaveLength(3);
    });

    it("accurately matches agents from the 500 catalog for all 3 shortcut presets", async () => {
      const presets = [
        {
          prompt:
            "Conduct a thorough market competitor analysis and draft an executive financial summary",
          expectedCategory: "Finance",
        },
        {
          prompt:
            "Parse vendor healthcare contracts, verify HIPAA BAA compliance rules, and export risk report",
          expectedCategory: "Legal",
        },
        {
          prompt:
            "Ingest multi-cloud AWS/GCP telemetry, cross-reference invoice line-items, and compute RI cost savings",
          expectedCategory: "DevOps",
        },
      ];

      for (const preset of presets) {
        const matches = heuristicSelectAgents(preset.prompt, preset.expectedCategory, 3);
        expect(matches).toHaveLength(3);
        expect(matches[0].stage).toBe("INGESTION");
        expect(matches[1].stage).toBe("PROCESSING");
        expect(matches[2].stage).toBe("VERIFICATION");

        // Ensure distinct agents selected
        const uniqueSlugs = new Set(matches.map((m) => m.agent.slug));
        expect(uniqueSlugs.size).toBe(3);

        // Ensure scores are positive
        matches.forEach((m) => {
          expect(m.score).toBeGreaterThan(0);
          expect(m.agent.title).toBeDefined();
          expect(m.agent.pricePaise).toBeGreaterThan(0);
        });
      }
    });
  });

  describe("Pipeline Decompose & Execute API Endpoints", () => {
    it("handles POST /api/compiler/decompose with valid payload", async () => {
      const req = new NextRequest("http://localhost:3000/api/compiler/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Conduct a thorough market competitor analysis and draft an executive financial summary",
          category: "Finance",
        }),
      });

      const res = await decomposeHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.pipeline).toBeDefined();
      expect(json.pipeline.nodes).toHaveLength(3);
      expect(json.compilerMode).toBeDefined();
    });

    it("rejects invalid payloads with HTTP 400 on /api/compiler/decompose", async () => {
      const req = new NextRequest("http://localhost:3000/api/compiler/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "x" }), // too short
      });

      const res = await decomposeHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBeDefined();
    });

    it("initializes execution via POST /api/pipeline/execute and returns execution ID and streamUrl", async () => {
      const compileRes = await autoCompileWorkflow({
        prompt: "Multi-cloud telemetry reconciliation and cost audit",
      });

      const req = new NextRequest("http://localhost:3000/api/pipeline/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline: compileRes.pipeline,
          initialInputs: { environment: "production" },
        }),
      });

      const res = await executeHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.executionId).toBeDefined();
      expect(json.streamUrl).toContain(json.executionId);
      expect(json.status).toBe("INITIALIZED");

      // Verify stored in execution store
      const stored = getPipelineExecution(json.executionId);
      expect(stored).toBeDefined();
      expect(stored?.pipelineId).toBe(compileRes.pipeline.id);
    });
  });

  describe("Server-Sent Events (SSE) Live Pipeline Streaming & Cryptographic Receipts", () => {
    it("streams pipeline execution events and delivers SHA-256 evidence receipt", async () => {
      const compileRes = await autoCompileWorkflow({
        prompt: "SEC financial filing extractor and audit verification",
        maxStages: 2, // fast test with 2 stages
      });

      const record = createPipelineExecution(compileRes.pipeline);

      const streamReq = new NextRequest(
        `http://localhost:3000/api/pipeline/stream?id=${record.executionId}`
      );

      const streamRes = await streamHandler(streamReq);
      expect(streamRes.status).toBe(200);
      expect(streamRes.headers.get("Content-Type")).toBe("text/event-stream");

      const body = streamRes.body;
      expect(body).toBeDefined();

      const reader = body!.getReader();
      const decoder = new TextDecoder();
      let streamOutput = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        streamOutput += decoder.decode(value, { stream: true });
      }

      // Verify all required SSE event types were emitted
      expect(streamOutput).toContain("event: pipeline_init");
      expect(streamOutput).toContain("event: node_start");
      expect(streamOutput).toContain("event: node_chunk");
      expect(streamOutput).toContain("event: node_done");
      expect(streamOutput).toContain("event: pipeline_done");

      // Extract pipeline_done event payload
      const doneIndex = streamOutput.indexOf("event: pipeline_done");
      expect(doneIndex).toBeGreaterThan(-1);

      const dataSlice = streamOutput.slice(doneIndex);
      const dataMatch = dataSlice.match(/data:\s*(\{.*\})/);
      expect(dataMatch).toBeDefined();

      const donePayload = JSON.parse(dataMatch![1]);
      expect(donePayload.status).toBe("COMPLETED");
      expect(donePayload.deliverable).toBeDefined();
      expect(donePayload.deliverable.summaryMarkdown).toContain("Autonomous Multi-Agent Pipeline");
      expect(donePayload.deliverable.structuredJson).toBeDefined();

      // Cryptographic Evidence Receipt Verification
      expect(donePayload.receipt).toBeDefined();
      expect(donePayload.receipt.receiptId).toMatch(/^rcpt_/);
      expect(donePayload.receipt.integrityHash).toBeDefined();

      // Verify SHA-256 integrity calculation matches receiptData
      const recomputedHash = computeReceiptHash(donePayload.receipt.receiptData);
      expect(donePayload.receipt.integrityHash).toBe(recomputedHash);
    });
  });
});
