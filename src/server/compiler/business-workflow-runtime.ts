import { createHash, randomUUID } from "node:crypto";
import { db } from "@/server/db";
import { invokeHostedTask } from "@/server/forgent/hosted-task-agent";
import { HOSTED_SAMPLE_AGENT_ID } from "@/lib/contracts/hosted-sample-fixtures";
import { runHostedSample } from "@/server/builder/evaluation/hosted-sample";

type Workflow = { agentIds: string[]; fingerprint: string; expiresAt: number };
const shared = globalThis as typeof globalThis & { businessDemoWorkflows?: Map<string, Workflow> };
const workflows = shared.businessDemoWorkflows ??= new Map<string, Workflow>();

export async function resolveBusinessWorkflow(agentIds: string[]) {
  if (!agentIds.length || agentIds.length > 5 || new Set(agentIds).size !== agentIds.length || agentIds.some((id) => id !== HOSTED_SAMPLE_AGENT_ID && !id.startsWith("listing:"))) throw new Error("A selected agent has no supported runtime.");
  const ids = agentIds.filter((id) => id.startsWith("listing:")).map((id) => id.slice("listing:".length));
  const listings = ids.length ? await db.marketplaceListing.findMany({ where: { id: { in: ids }, status: "PUBLISHED" }, select: { id: true, endpointUrl: true } }) : [];
  const byId = new Map(listings.map((item) => [item.id, item.endpointUrl]));
  if (ids.some((id) => !byId.has(id))) throw new Error("A published agent is unavailable. Refresh the recommendations.");
  const fingerprint = createHash("sha256").update(JSON.stringify(agentIds.map((id) => [id, id === HOSTED_SAMPLE_AGENT_ID ? "platform-v1" : byId.get(id.slice("listing:".length))]))).digest("hex");
  const execute = async (task: string) => {
    let value = task;
    for (const id of agentIds) value = id === HOSTED_SAMPLE_AGENT_ID ? await runHostedSample(value) : await invokeHostedTask(byId.get(id.slice("listing:".length))!, value);
    return value;
  };
  return { execute, fingerprint };
}

export function registerBusinessDemoWorkflow(agentIds: string[], fingerprint: string) {
  const now = Date.now();
  for (const [id, workflow] of workflows) if (workflow.expiresAt <= now) workflows.delete(id);
  if (workflows.size >= 100) throw new Error("Demo workflow capacity reached.");
  const id = randomUUID();
  workflows.set(id, { agentIds: [...agentIds], fingerprint, expiresAt: now + 60 * 60 * 1000 });
  return id;
}

export async function runBusinessDemoWorkflow(id: string, task: string) {
  const workflow = workflows.get(id);
  if (!workflow || workflow.expiresAt <= Date.now()) { workflows.delete(id); return null; }
  const current = await resolveBusinessWorkflow(workflow.agentIds);
  if (current.fingerprint !== workflow.fingerprint) { workflows.delete(id); return null; }
  return current.execute(task);
}
