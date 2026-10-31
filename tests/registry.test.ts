import { describe, it, expect, beforeEach } from "vitest";
import { AgentRegistry, AgentRegistryError } from "@/server/agents/registry";
import { AgentAdapter, AgentExecutionContext, AgentExecutionResult } from "@/server/agents/adapter";
import { AgentManifest } from "@/lib/contracts/domain";

describe("AgentRegistry Foundation Suite", () => {
  let registry: AgentRegistry;

  const mockManifest: AgentManifest = {
    manifestVersion: "1.0.0",
    agentId: "test-reconciliation",
    version: "1.0.0",
    name: "Test Reconciliation Agent",
    summary: "Mock unit adapter",
    builderId: "builder-jordan-lee",
    capabilities: ["quantity_reconciliation"],
    permissions: ["read:purchase_orders", "read:invoices"],
    pricing: { model: "PER_STAGE", pricePaise: 250000 },
    estimatedLatencyMs: 800,
    limitations: [],
    fallbackVersionIds: ["1.1.0"],
    runtimeAdapter: "test-adapter",
    executionEligible: true,
    registryVisible: true,
  };

  const mockAdapter: AgentAdapter = {
    manifest: mockManifest,
    async execute(input: unknown, context: AgentExecutionContext): Promise<AgentExecutionResult> {
      return {
        status: "SUCCESS",
        durationMs: 120,
        output: { matched: true },
      };
    },
  };

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  it("registers and resolves an agent adapter by exact identity and version", () => {
    registry.register(mockAdapter);
    expect(registry.has("test-reconciliation", "1.0.0")).toBe(true);

    const resolved = registry.resolve("test-reconciliation", "1.0.0");
    expect(resolved.manifest.agentId).toBe("test-reconciliation");
    expect(resolved.manifest.version).toBe("1.0.0");
  });

  it("rejects duplicate registration with DUPLICATE_REGISTRATION error", () => {
    registry.register(mockAdapter);
    expect(() => registry.register(mockAdapter)).toThrow(AgentRegistryError);
    try {
      registry.register(mockAdapter);
    } catch (err: any) {
      expect(err.code).toBe("DUPLICATE_REGISTRATION");
    }
  });

  it("rejects unknown adapter or version with ADAPTER_NOT_FOUND without substitution", () => {
    expect(() => registry.resolve("unknown-agent", "1.0.0")).toThrow(AgentRegistryError);
    try {
      registry.resolve("unknown-agent", "1.0.0");
    } catch (err: any) {
      expect(err.code).toBe("ADAPTER_NOT_FOUND");
    }
  });

  it("rejects registering an adapter with malformed manifest", () => {
    const invalidAdapter: any = {
      manifest: {
        agentId: "invalid-agent",
        version: "invalid-semver",
      },
      execute: async () => ({ status: "SUCCESS", durationMs: 10 }),
    };
    expect(() => registry.register(invalidAdapter)).toThrow(AgentRegistryError);
  });
});
