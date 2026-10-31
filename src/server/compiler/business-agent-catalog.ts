import { z } from "zod";
import { db } from "@/server/db";
import { getMarketplaceManifests } from "@/server/agents/manifests";
import { CompilerAgentSchema, type CompilerAgent } from "./business-compiler-contracts";

export async function listCompilerAgents(): Promise<{ agents: CompilerAgent[]; source: "database" | "seed" }> {
  try {
    const rows = await db.agentVersion.findMany({
      where: { status: "ACTIVE", registryVisible: true, executionEligible: true, agent: { registryVisible: true } },
      include: { agent: true, capabilities: true }, take: 100,
    });
    const agents = rows.flatMap((row) => {
      const parsed = CompilerAgentSchema.safeParse({
        id: row.versionId, name: row.title || row.agent.name, summary: row.description || row.agent.summary,
        capabilities: row.capabilities.map((capability) => capability.capabilityKey),
        permissions: z.array(z.string()).catch([]).parse(row.permissionsJson),
        limitations: z.array(z.string()).catch([]).parse(row.limitationsJson),
        pricePaise: row.pricePaise, latencyMs: row.estimatedLatencyMs,
        inputSchema: row.inputSchema ?? row.agent.inputSchema, outputSchema: row.outputSchema ?? row.agent.outputSchema,
      });
      return parsed.success ? [parsed.data] : [];
    });
    if (agents.length || process.env.NODE_ENV === "production") return { agents, source: "database" };
  } catch {
    if (process.env.NODE_ENV === "production") throw new Error("Agent registry unavailable");
  }
  return { source: "seed", agents: getMarketplaceManifests().filter((item) => item.executionEligible).map((item) => ({
    id: `${item.agentId}@${item.version}`, name: item.name, summary: item.summary,
    capabilities: item.capabilities, permissions: item.permissions, limitations: item.limitations,
    pricePaise: item.pricing.pricePaise, latencyMs: item.estimatedLatencyMs, inputSchema: null, outputSchema: null,
  })) };
}
