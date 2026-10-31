import { describe, it, expect } from "vitest";
import {
  EnterprisePipelineSchema,
  TestFlightRequestSchema,
} from "@/lib/contracts/enterprise-types";
import {
  INITIAL_ENTERPRISE_PIPELINES,
  INITIAL_DEPARTMENT_BUDGETS,
  INITIAL_AUDIT_LOGS,
  generateCustomWorkflowFromPrompt,
} from "@/data/enterprise-data";
import { POST as testFlightHandler } from "@/app/api/enterprise/test-flight/route";
import { NextRequest } from "next/server";

describe("Enterprise Workflow Hub & Synthetic Test Flight Engine", () => {
  it("validates that all seed pipelines conform strictly to EnterprisePipelineSchema", () => {
    expect(INITIAL_ENTERPRISE_PIPELINES.length).toBeGreaterThanOrEqual(3);

    for (const pipeline of INITIAL_ENTERPRISE_PIPELINES) {
      const parsed = EnterprisePipelineSchema.safeParse(pipeline);
      expect(parsed.success, `Pipeline ${pipeline.id} schema validation failed`).toBe(true);

      // Verify 3 distinct sequential stages in the DAG
      const stages = pipeline.nodes.map((n) => n.stage);
      expect(stages).toContain("INGESTION");
      expect(stages).toContain("PROCESSING");
      expect(stages).toContain("VERIFICATION");

      // Verify monetary precision in integer paise
      expect(Number.isInteger(pipeline.totalCostPaise)).toBe(true);
      expect(pipeline.totalCostPaise).toBeGreaterThan(0);

      // Verify connections
      expect(pipeline.connections.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("generates an on-demand custom workflow DAG with parameter bindings", () => {
    const custom = generateCustomWorkflowFromPrompt(
      "Healthcare HIPAA BAA Contract Analyzer",
      "Legal"
    );

    expect(custom.name).toBe("Healthcare HIPAA BAA Contract Analyzer");
    expect(custom.category).toBe("Legal");
    expect(custom.nodes).toHaveLength(3);
    expect(custom.nodes[0].stage).toBe("INGESTION");
    expect(custom.nodes[1].stage).toBe("PROCESSING");
    expect(custom.nodes[2].stage).toBe("VERIFICATION");

    // Output of node 1 mapped into input of node 2
    expect(custom.connections[0].fromNodeId).toBe(custom.nodes[0].id);
    expect(custom.connections[0].toNodeId).toBe(custom.nodes[1].id);

    // Output of node 2 mapped into input of node 3
    expect(custom.connections[1].fromNodeId).toBe(custom.nodes[1].id);
    expect(custom.connections[1].toNodeId).toBe(custom.nodes[2].id);
  });

  it("executes synthetic test flight via POST /api/enterprise/test-flight and returns live telemetry", async () => {
    const pipeline = INITIAL_ENTERPRISE_PIPELINES[0];
    const request = new NextRequest("http://localhost:3000/api/enterprise/test-flight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline }),
    });

    const response = await testFlightHandler(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.certified).toBe(true);
    expect(data.certificationHash).toBeDefined();

    // Verify 3 Live Animated Telemetry Gauges
    expect(data.telemetry).toBeDefined();
    // 1. Schema Integrity Gauge: 100% payload pass rate
    expect(data.telemetry.schemaIntegrityPercent).toBe(100);
    // 2. Latency & SLA Stress Gauge: <3.5s per stage
    expect(data.telemetry.slaMet).toBe(true);
    expect(data.telemetry.maxStageLatencyMs).toBeLessThan(3500);
    expect(data.telemetry.latencyPerStageMs.INGESTION).toBeDefined();
    expect(data.telemetry.latencyPerStageMs.PROCESSING).toBeDefined();
    expect(data.telemetry.latencyPerStageMs.VERIFICATION).toBeDefined();
    // 3. Cost & Token Efficiency Gauge: integer paise
    expect(data.telemetry.totalExecutionCostPaise).toBe(pipeline.totalCostPaise);
    expect(data.telemetry.tokenEfficiencyTokensPerRupee).toBeGreaterThan(0);

    // Verify 3 synthetic test vectors
    expect(data.vectors).toHaveLength(3);
    const keys = data.vectors.map((v: { key: string }) => v.key);
    expect(keys).toContain("HAPPY_PATH");
    expect(keys).toContain("MALFORMED_EDGE");
    expect(keys).toContain("HIGH_VOLUME_STRESS");

    // All vectors passed
    for (const vector of data.vectors) {
      expect(vector.status).toBe("passed");
      expect(vector.logs.length).toBeGreaterThan(2);
    }
  });

  it("rejects malformed requests to /api/enterprise/test-flight with HTTP 400", async () => {
    const invalidRequest = new NextRequest("http://localhost:3000/api/enterprise/test-flight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pipeline: { invalid: true } }),
    });

    const response = await testFlightHandler(invalidRequest);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it("verifies Departmental Spend & Budget Allocation balances", () => {
    expect(INITIAL_DEPARTMENT_BUDGETS.length).toBe(5);

    for (const budget of INITIAL_DEPARTMENT_BUDGETS) {
      expect(Number.isInteger(budget.allocatedPaise)).toBe(true);
      expect(Number.isInteger(budget.spentPaise)).toBe(true);
      expect(Number.isInteger(budget.escrowLockedPaise)).toBe(true);
      expect(budget.spentPaise).toBeLessThanOrEqual(budget.allocatedPaise);
      expect(budget.authorizedOwner.length).toBeGreaterThan(0);
    }
  });

  it("verifies Team Member Activity Log entries maintain cryptographic verification hashes", () => {
    expect(INITIAL_AUDIT_LOGS.length).toBeGreaterThanOrEqual(5);

    for (const log of INITIAL_AUDIT_LOGS) {
      expect(log.id).toBeDefined();
      expect(log.executor).toBeDefined();
      expect(log.department).toBeDefined();
      expect(log.verificationHash).toMatch(/^[a-f0-9]{12,}/i);
      expect(Number.isInteger(log.escrowDebitedPaise)).toBe(true);
      expect(["COMMITTED", "SETTLED", "ESCROW_LOCKED", "REVERTED"]).toContain(log.status);
    }
  });
});
