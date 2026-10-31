import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  executeSandboxTask,
  exportSandboxTestFixture,
  calculateWaterfall,
  calculateDualCurrencyPricing,
  resolveSandboxAgent,
  inspectSandboxToolCall,
} from "@/server/sandbox/sandbox-engine";
import { validateSchemaContract } from "@/server/builder/qualify-engine";
import { POST as executeRoute } from "@/app/api/sandbox/execute/route";
import { POST as exportTestRoute } from "@/app/api/sandbox/export-test/route";
import { SandboxTelemetryChunk } from "@/lib/contracts/sandbox-types";

describe("Agent Sandbox & Playground Suite", () => {
  describe("1. Agent Resolution & Mock Sandbox Execution", () => {
    it("resolves catalog agents from the 500-agent dataset", () => {
      const financeAgent = resolveSandboxAgent("3-way-erp-invoice-reconciler");
      expect(financeAgent).toBeDefined();
      expect(financeAgent.category).toBe("Finance");
      expect(financeAgent.title).toBe("3-Way ERP Invoice Reconciler");

      const devopsAgent = resolveSandboxAgent("terraform-drift-remediation-worker");
      expect(devopsAgent).toBeDefined();
      expect(devopsAgent.category).toBe("DevOps");
    });

    it("generates deterministic fallback for custom unlisted agent slugs", () => {
      const custom = resolveSandboxAgent("custom-enterprise-data-pipeline");
      expect(custom).toBeDefined();
      expect(custom.slug).toBe("custom-enterprise-data-pipeline");
      expect(custom.title).toBe("Custom Enterprise Data Pipeline");
    });

    it("executes mock sandbox task and returns domain-specific deliverable", async () => {
      const result = await executeSandboxTask({
        agentSlug: "3-way-erp-invoice-reconciler",
        inputPayload: {
          invoiceId: "INV-2026-001",
          purchaseOrderId: "PO-99120",
          variancePaiseLimit: 0,
        },
        executionMode: "mock",
        latencyCeilingMs: 3500,
      });

      expect(result.status).toBe("COMPLETED");
      expect(result.agentTitle).toBe("3-Way ERP Invoice Reconciler");
      expect(result.category).toBe("Finance");
      expect(result.structuredOutput).toBeDefined();
      expect(result.structuredOutput.status).toBe("RECONCILED");
      expect(result.summaryMarkdown).toContain("Autonomous Sandbox Execution Deliverable");
      expect(result.summaryMarkdown).toContain("3-Way ERP Invoice Reconciler");
    });
  });

  describe("2. Latency Waterfall Profiling & SLA Violation Detection", () => {
    it("calculates multi-phase timing waterfall adhering to total sum", () => {
      const waterfall = calculateWaterfall(3500, 1.0);

      expect(waterfall.dnsConnectMs).toBeGreaterThan(0);
      expect(waterfall.gatewayMs).toBeGreaterThan(0);
      expect(waterfall.ttftMs).toBeGreaterThan(0);
      expect(waterfall.generationMs).toBeGreaterThan(0);

      const calculatedTotal =
        waterfall.dnsConnectMs +
        waterfall.gatewayMs +
        waterfall.ttftMs +
        waterfall.generationMs;
      expect(waterfall.totalLatencyMs).toBe(calculatedTotal);
      expect(waterfall.slaThresholdMs).toBe(3500);
      expect(waterfall.slaViolated).toBe(false);
    });

    it("flags SLA violations when total latency exceeds ceiling", () => {
      // Set an aggressive ceiling below minimum execution time
      const waterfall = calculateWaterfall(150, 1.0);

      expect(waterfall.slaViolated).toBe(true);
      expect(waterfall.totalLatencyMs).toBeGreaterThan(waterfall.slaThresholdMs);
    });

    it("reports SLA_BREACH status in execution result when ceiling breached", async () => {
      const result = await executeSandboxTask({
        agentSlug: "3-way-erp-invoice-reconciler",
        inputPayload: { sample: "test" },
        executionMode: "mock",
        latencyCeilingMs: 100, // Impossibly low ceiling
      });

      expect(result.status).toBe("SLA_BREACH");
      expect(result.waterfall.slaViolated).toBe(true);
    });
  });

  describe("3. Dual-Currency Token Economics & Integer Paise Precision", () => {
    it("computes USD and INR pricing maintaining integer paise precision", () => {
      const agent = resolveSandboxAgent("3-way-erp-invoice-reconciler");
      const pricing = calculateDualCurrencyPricing(250, 400, agent);

      expect(pricing.promptTokens).toBe(250);
      expect(pricing.completionTokens).toBe(400);
      expect(pricing.totalTokens).toBe(650);

      // Verify USD formatting
      expect(pricing.formattedCostUsd).toMatch(/^\$\d+\.\d{4}$/);

      // Verify integer paise precision (no floating-point paise)
      expect(Number.isInteger(pricing.costPaise)).toBe(true);
      expect(pricing.formattedCostInr).toMatch(/^₹\d+\.\d{2}$/);
    });

    it("guarantees zero floating-point drift across varying token loads", () => {
      const agent = resolveSandboxAgent("terraform-drift-remediation-worker");

      for (let tokens = 100; tokens <= 5000; tokens += 600) {
        const pricing = calculateDualCurrencyPricing(tokens, tokens * 2, agent);
        expect(Number.isInteger(pricing.costPaise)).toBe(true);
        expect(pricing.costPaise).toBeGreaterThan(0);
      }
    });
  });

  describe("4. Tool Gateway Zero-Trust Sanitization Inspection", () => {
    it("intercepts tool payloads and redacts secrets and PII", async () => {
      const agent = resolveSandboxAgent("3-way-erp-invoice-reconciler");
      const sensitivePayload = {
        apiKey: "sk_live_9a8b7c6d5e4f3a2b1c0d",
        userEmail: "auditor@enterprise.internal",
        customerSsn: "000-12-3456",
        safeNote: "Audited monthly transaction batch",
      };

      const inspection = await inspectSandboxToolCall(agent, sensitivePayload, {
        zeroTrustPiiMasking: true,
        networkEgressContainment: true,
        consequentialStateMutationLock: true,
        allowedCapabilities: ["compute:variance", "read:analytics"],
      });

      expect(inspection).toBeDefined();
      if (!inspection) return;

      expect(inspection.verdict).toBe("REDACTED");
      expect(inspection.redactedKeys.length).toBeGreaterThanOrEqual(2);
      expect(inspection.policyEvaluations.piiMasked).toBe(true);
      expect(inspection.policyEvaluations.secretsRedacted).toBe(true);

      const sanitizedStr = JSON.stringify(inspection.sanitizedPayload);
      expect(sanitizedStr).not.toContain("sk_live_9a8b7c6d5e4f3a2b1c0d");
      expect(sanitizedStr).not.toContain("000-12-3456");
      expect(sanitizedStr).toContain("safeNote");
    });

    it("blocks prohibited dangerous operations via tool gateway policy", async () => {
      const agent = resolveSandboxAgent("3-way-erp-invoice-reconciler");
      const prohibitedPayload = {
        command: "drop database production",
      };

      // Call tool gateway with prohibited operation
      const { ToolGateway } = await import("@/server/gateway/tool-gateway");
      const gateway = new ToolGateway();
      const intercept = await gateway.interceptToolCall({
        callerAgentId: agent.id,
        toolName: "admin-tool",
        operation: "db:drop",
        payload: prohibitedPayload,
      });

      expect(intercept.verdict).toBe("BLOCKED");
      expect(intercept.blockedReason).toContain("prohibited");
    });
  });

  describe("5. Live Streaming Telemetry Chunks", () => {
    it("emits sequential SSE chunks with memory telemetry", async () => {
      const chunks: SandboxTelemetryChunk[] = [];

      await executeSandboxTask(
        {
          agentSlug: "3-way-erp-invoice-reconciler",
          inputPayload: { batch: "sample" },
          executionMode: "mock",
          latencyCeilingMs: 3500,
        },
        (chunk) => {
          chunks.push(chunk);
        }
      );

      expect(chunks.length).toBeGreaterThanOrEqual(4);
      const stages = chunks.map((c) => c.stage);
      expect(stages).toContain("INIT");
      expect(stages).toContain("CONNECTING");
      expect(stages).toContain("FIRST_TOKEN");
      expect(stages).toContain("STREAMING");
      expect(stages).toContain("COMPLETED");

      // Verify memory telemetry presence
      const initChunk = chunks.find((c) => c.stage === "INIT");
      expect(initChunk?.memory).toBeDefined();
      expect(initChunk?.memory?.heapUsedBytes).toBeGreaterThan(0);
    });
  });

  describe("6. Creator Qualification Test Fixture Export", () => {
    it("exports standardized test fixture conforming to qualification specification", () => {
      const fixture = exportSandboxTestFixture({
        agentSlug: "3-way-erp-invoice-reconciler",
        inputPayload: {
          invoiceId: "INV-100",
          amountPaise: 50000,
        },
        expectedOutput: {
          status: "RECONCILED",
          variancePaise: 0,
        },
        latencyCeilingMs: 3500,
        targetStage: "consistency",
      });

      expect(fixture.fixtureId).toMatch(/^fix-qual-/);
      expect(fixture.version).toBe("1.0.0");
      expect(fixture.agentSlug).toContain("3-way-erp-invoice-reconciler");
      expect(fixture.targetStage).toBe("consistency");
      expect(fixture.fixtureChecksum).toBeDefined();
      expect(fixture.fixtureChecksum.length).toBe(64); // SHA-256 length

      // Assertions schema
      expect(fixture.assertions.maxLatencyMs).toBe(3500);
      expect(fixture.assertions.requiredOutputKeys).toContain("status");

      // QualifyEngine schema validation
      const validation = validateSchemaContract(
        fixture.qualifyEnginePayload.inputSchema,
        fixture.qualifyEnginePayload.outputSchema
      );
      expect(validation.passed).toBe(true);
    });
  });

  describe("7. API Route Endpoints", () => {
    it("handles POST /api/sandbox/execute in non-streaming mode", async () => {
      const req = new NextRequest("http://localhost:3000/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentSlug: "3-way-erp-invoice-reconciler",
          inputPayload: { test: true },
          executionMode: "mock",
          latencyCeilingMs: 3500,
        }),
      });

      const res = await executeRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.executionId).toBeDefined();
      expect(json.status).toBe("COMPLETED");
      expect(json.waterfall).toBeDefined();
      expect(json.tokens).toBeDefined();
    });

    it("rejects invalid request payloads on /api/sandbox/execute with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentSlug: "", // invalid empty slug
        }),
      });

      const res = await executeRoute(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toBe("VALIDATION_ERROR");
    });

    it("handles POST /api/sandbox/export-test and returns qualification fixture", async () => {
      const req = new NextRequest("http://localhost:3000/api/sandbox/export-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentSlug: "3-way-erp-invoice-reconciler",
          inputPayload: { invoiceNum: "123" },
          expectedOutput: { verified: true },
          latencyCeilingMs: 3500,
          targetStage: "latency",
        }),
      });

      const res = await exportTestRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.fixtureId).toBeDefined();
      expect(json.targetStage).toBe("latency");
      expect(json.fixtureChecksum).toBeDefined();
    });
  });
});
