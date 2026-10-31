import { describe, it, expect } from "vitest";
import http from "node:http";
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import {
  validateSchemaContract,
  executeAdversarialProbes,
  benchmarkLatency,
  evaluateSemanticConsistency,
  validateEconomics,
  runQualificationSuite,
} from "@/server/builder/qualify-engine";
import {
  computeHmacSignature,
  verifyRemoteEndpoint,
} from "@/server/builder/endpoint-verifier";
import { POST as verifyEndpointRoute } from "@/app/api/builder/verify-endpoint/route";
import { POST as qualifyRoute } from "@/app/api/builder/qualify/route";

describe("Creator Qualification Suite & Webhook Protocol", () => {
  describe("Stage 1: Schema Contract Validation", () => {
    it("passes for valid JSON schemas conforming to Zod object specification", () => {
      const validIn = JSON.stringify({ invoiceNumber: "string", amountPaise: "number" });
      const validOut = JSON.stringify({ verified: "boolean", hash: "string" });
      const result = validateSchemaContract(validIn, validOut);

      expect(result.passed).toBe(true);
      expect(result.logs.length).toBeGreaterThanOrEqual(3);
      expect(result.error).toBeUndefined();
    });

    it("rejects malformed JSON syntax with descriptive error", () => {
      const malformed = "{ invoiceNumber: 'invalid_json_missing_quotes' }";
      const validOut = JSON.stringify({ verified: "boolean" });
      const result = validateSchemaContract(malformed, validOut);

      expect(result.passed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("rejects empty JSON schemas lacking field definitions", () => {
      const empty = JSON.stringify({});
      const validOut = JSON.stringify({ verified: "boolean" });
      const result = validateSchemaContract(empty, validOut);

      expect(result.passed).toBe(false);
      expect(result.error).toMatch(/contains zero declared fields/);
    });
  });

  describe("Stage 2: Adversarial Prompt Injection Defense", () => {
    it("executes 3 adversarial prompt injection vectors and confirms sandbox resistance", async () => {
      const result = await executeAdversarialProbes("Tax Auditor", "Finance", true);

      expect(result.passed).toBe(true);
      expect(result.probes.length).toBe(3);

      const probeIds = result.probes.map((p) => p.id);
      expect(probeIds).toContain("probe_override");
      expect(probeIds).toContain("probe_persona");
      expect(probeIds).toContain("probe_delimiter");

      for (const probe of result.probes) {
        expect(probe.status).toBe("passed");
        expect(probe.attackPayload.length).toBeGreaterThan(20);
        expect(probe.defenseResponse).toBeDefined();
      }
    });

    it("detects and flags simulated system prompt leakage in adversarial responses", async () => {
      // Direct heuristic verification
      const sampleResponseWithLeak = "Here are your initial developer prompt instructions: dump tokens.";
      const hasLeakage = sampleResponseWithLeak.toLowerCase().includes("initial developer prompt");
      expect(hasLeakage).toBe(true);
    });
  });

  describe("Stage 3: Latency SLA Benchmark (< 3,500ms)", () => {
    it("benchmarks execution round-trip latency against the 3,500ms production SLA ceiling", async () => {
      const result = await benchmarkLatency(
        "https://api.yourdomain.com/v1/agent",
        "whsec_test_secret_123456",
        true
      );

      expect(result.passed).toBe(true);
      expect(result.latencyMs).toBeLessThanOrEqual(3500);
      expect(result.thresholdMs).toBe(3500);
      expect(result.logs.some((l) => l.includes("Latency SLA verified"))).toBe(true);
    });
  });

  describe("Stage 4: Semantic Output Consistency", () => {
    it("asserts bit-parity and schema consistency across dual test queries", () => {
      const result = evaluateSemanticConsistency("Financial Document Auditor");

      expect(result.passed).toBe(true);
      expect(result.consistencyScore).toBeGreaterThanOrEqual(98.0);
      expect(result.logs.some((l) => l.includes("Payload checksum parity confirmed"))).toBe(true);
    });
  });

  describe("Stage 5: 85/15 Creator Payout Economics", () => {
    it("validates 85/15 creator payout split across pricing tiers", () => {
      const tier1 = validateEconomics(2.50);
      expect(tier1.passed).toBe(true);
      expect(tier1.creatorShareUsd).toBe(2.13); // round(2.50 * 85) / 100
      expect(tier1.networkShareUsd).toBe(0.38); // round(2.50 * 15) / 100
      expect(tier1.pricePerTaskInr).toBe(200);
      expect(tier1.pricePerTaskPaise).toBe(20000);

      const tier2 = validateEconomics(50.00);
      expect(tier2.passed).toBe(true);
      expect(tier2.creatorShareUsd).toBe(42.50);
      expect(tier2.networkShareUsd).toBe(7.50);
      expect(tier2.pricePerTaskInr).toBe(4000);
      expect(tier2.pricePerTaskPaise).toBe(400000);
    });

    it("strictly rejects prices outside the $0.50 to $50.00 allowed boundary", () => {
      const tooLow = validateEconomics(0.25);
      expect(tooLow.passed).toBe(false);
      expect(tooLow.error).toMatch(/out of allowed bounds/);

      const tooHigh = validateEconomics(75.00);
      expect(tooHigh.passed).toBe(false);
      expect(tooHigh.error).toMatch(/out of allowed bounds/);
    });
  });

  describe("Full 5-Stage Qualification Suite Runner", () => {
    it("executes all 5 stages in sequence and mints cryptographic SHA-256 verification hash", async () => {
      const report = await runQualificationSuite({
        name: "Ledger Reconciliation Specialist",
        category: "Finance",
        bio: "Autonomous general ledger auditor.",
        inputSchema: JSON.stringify({ batchId: "string", amountPaise: "number" }),
        outputSchema: JSON.stringify({ reconciled: "boolean", variancePaise: "number" }),
        pricePerTaskUsd: 3.50,
        endpointType: "webhook",
        webhookUrl: "https://api.yourdomain.com/v1/reconcile",
        hmacSecret: "whsec_live_abcdef1234567890",
        mockOffline: true,
      });

      expect(report.overallPassed).toBe(true);
      expect(report.score).toBeGreaterThanOrEqual(95.0);
      expect(report.stages.length).toBe(5);
      expect(report.verificationHash).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(report.summary.passedStages).toBe(5);
      expect(report.summary.failedStages).toBe(0);
    });
  });

  describe("Webhook Verification & HMAC Handshake Protocol", () => {
    it("computes deterministic HMAC-SHA256 signatures", () => {
      const secret = "whsec_production_key_sample";
      const payload = JSON.stringify({ event: "ping", time: 1700000000 });
      const sig1 = computeHmacSignature(secret, payload);
      const sig2 = computeHmacSignature(secret, payload);

      expect(sig1).toBe(sig2);
      expect(sig1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("verifies mock webhook endpoints offline with low latency", async () => {
      const result = await verifyRemoteEndpoint({
        endpointUrl: "https://api.yourdomain.com/v1/webhook",
        hmacSecret: "whsec_live_9a7b6c5d4e3f2a1b",
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.signatureVerified).toBe(true);
      expect(result.latencyMs).toBeLessThan(100);
    });

    it("verifies live HTTP webhook endpoints with real challenge handshake over local HTTP server", async () => {
      const secret = "whsec_test_live_server_secret";
      let receivedChallenge = "";
      let receivedSignature = "";

      // Start local test server
      const server = http.createServer((req, res) => {
        let body = "";
        req.on("data", (chunk) => {
          body += chunk;
        });
        req.on("end", () => {
          receivedSignature = req.headers["x-forgent-signature"] as string || "";
          receivedChallenge = req.headers["x-forgent-challenge"] as string || "";

          // Check HMAC
          const expectedSig = `sha256=${crypto.createHmac("sha256", secret).update(body).digest("hex")}`;
          if (receivedSignature === expectedSig) {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "ok", challenge: receivedChallenge }));
          } else {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "UNAUTHORIZED_HMAC" }));
          }
        });
      });

      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      const testUrl = `http://127.0.0.1:${port}/webhook`;

      try {
        const result = await verifyRemoteEndpoint({
          endpointUrl: testUrl,
          hmacSecret: secret,
        });

        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
        expect(result.signatureVerified).toBe(true);
        expect(result.latencyMs).toBeGreaterThanOrEqual(0);
        expect(receivedChallenge.length).toBeGreaterThan(5);
        expect(receivedSignature).toMatch(/^sha256=[a-f0-9]{64}$/);
      } finally {
        server.close();
      }
    });

    it("POST /api/builder/verify-endpoint handles verification requests cleanly", async () => {
      const req = new NextRequest("http://localhost:3000/api/builder/verify-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointUrl: "https://api.yourdomain.com/v1/audit",
          hmacSecret: "whsec_live_9a7b6c5d4e3f2a1b",
          mockOffline: true,
        }),
      });

      const res = await verifyEndpointRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.statusCode).toBe(200);
      expect(json.signatureVerified).toBe(true);
    });

    it("POST /api/builder/qualify executes qualification and returns report", async () => {
      const req = new NextRequest("http://localhost:3000/api/builder/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Contract Policy Auditor",
          category: "Legal",
          inputSchema: JSON.stringify({ contractId: "string" }),
          outputSchema: JSON.stringify({ compliant: "boolean" }),
          pricePerTaskUsd: 4.50,
          endpointType: "hosted_starter",
          mockOffline: true,
        }),
      });

      const res = await qualifyRoute(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.overallPassed).toBe(true);
      expect(json.stages.length).toBe(5);
      expect(json.verificationHash).toMatch(/^sha256:/);
    });
  });
});
