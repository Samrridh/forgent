import { AgentAdapter, validateAgentManifest } from "./adapter";

export class AgentRegistryError extends Error {
  constructor(public code: "DUPLICATE_REGISTRATION" | "ADAPTER_NOT_FOUND" | "INVALID_MANIFEST", message: string) {
    super(message);
    this.name = "AgentRegistryError";
  }
}

export class AgentRegistry {
  private adapters = new Map<string, AgentAdapter>();

  private makeKey(agentId: string, version: string): string {
    return `${agentId}@${version}`;
  }

  public register(adapter: AgentAdapter): void {
    // Validate manifest strictly
    try {
      validateAgentManifest(adapter.manifest);
    } catch (err) {
      throw new AgentRegistryError(
        "INVALID_MANIFEST",
        `Manifest validation failed for ${adapter.manifest?.agentId ?? "unknown"}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const key = this.makeKey(adapter.manifest.agentId, adapter.manifest.version);
    if (this.adapters.has(key)) {
      throw new AgentRegistryError(
        "DUPLICATE_REGISTRATION",
        `Agent adapter already registered for key: ${key}`
      );
    }

    this.adapters.set(key, adapter);
  }

  public resolve(agentId: string, version: string): AgentAdapter {
    const key = this.makeKey(agentId, version);
    const adapter = this.adapters.get(key);
    if (!adapter) {
      throw new AgentRegistryError(
        "ADAPTER_NOT_FOUND",
        `No registered agent adapter found for key: ${key}. Platform refuses to silently substitute alternative versions.`
      );
    }
    return adapter;
  }

  public has(agentId: string, version: string): boolean {
    return this.adapters.has(this.makeKey(agentId, version));
  }

  public list(): AgentAdapter[] {
    return Array.from(this.adapters.values());
  }

  public clear(): void {
    this.adapters.clear();
  }
}

// Global singleton instance for platform runtime
export const agentRegistry = new AgentRegistry();
