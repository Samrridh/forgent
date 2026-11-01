import { z } from "zod";
import { db } from "@/server/db";
import { getMarketplaceManifests } from "@/server/agents/manifests";
import { CompilerAgentSchema, type CompilerAgent } from "./business-compiler-contracts";
import { HOSTED_SAMPLE_AGENT_ID } from "@/lib/contracts/hosted-sample-fixtures";

const sample: CompilerAgent = {
  id: HOSTED_SAMPLE_AGENT_ID, name: "Support knowledge assistant (demo)",
  summary: "Answers questions about inviting members, resetting passwords, and notification settings from fixed sample articles. Sends unfamiliar questions to a person.",
  capabilities: ["answer support questions using sample knowledge articles"], permissions: [],
  limitations: ["Platform demo with fixed sample articles; does not access business data."], pricePaise: 0, latencyMs: 0,
  inputSchema: { type: "object", properties: { task: { type: "string" } }, required: ["task"] },
  outputSchema: { type: "object", properties: { result: { type: "string" } }, required: ["result"] },
};

export async function listCompilerAgents(): Promise<{ agents: CompilerAgent[]; source: "database" | "seed"; fallbackReason?: "empty" | "unavailable" }> {
  let fallbackReason: "empty" | "unavailable" = "empty";
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
    const listings = await db.marketplaceListing.findMany({ where: { status: "PUBLISHED" }, take: 100 }).catch(() => []);
    agents.push(...listings.map((listing) => ({
      id: `listing:${listing.id}`, name: listing.name, summary: listing.description,
      capabilities: [listing.category], permissions: [], limitations: ["Builder-hosted endpoint; behavior and permissions require review."],
      pricePaise: listing.pricePaise, latencyMs: 0, inputSchema: listing.inputSchema, outputSchema: listing.outputSchema,
    })));
    if (agents.length || process.env.NODE_ENV === "production") return { agents: process.env.NODE_ENV === "production" ? agents : [...agents, sample], source: "database" };
  } catch {
    if (process.env.NODE_ENV === "production") throw new Error("Agent registry unavailable");
    fallbackReason = "unavailable";
  }
  return { source: "seed", fallbackReason, agents: [...getMarketplaceManifests().filter((item) => item.executionEligible).map((item) => ({
    id: `${item.agentId}@${item.version}`, name: item.name, summary: item.summary,
    capabilities: item.capabilities, permissions: item.permissions, limitations: item.limitations,
    pricePaise: item.pricing.pricePaise, latencyMs: item.estimatedLatencyMs, inputSchema: null, outputSchema: null,
  })), sample] };
}
