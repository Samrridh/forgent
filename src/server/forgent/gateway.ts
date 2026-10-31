import { runnableProjectAgents } from "@/data/project-example-agents";
import { runTextAgent } from "./text-agent";
import { randomUUID } from "node:crypto";
import { RunInputSchema, type DemoRun } from "./contracts";
import { hashSecret, withDemoStore } from "./demo-store";
import { generateSupportAnswer } from "./support-agent";
import { invokeRemoteAgent, RemoteAgentError } from "./remote-agent";
export class GatewayError extends Error { constructor(public status:number, public code:string, message:string) { super(message); } }
export async function runAgent(secret:string, body:unknown, idempotencyKey:string|null):Promise<DemoRun> {
  const parsed=RunInputSchema.safeParse(body);
  if (!parsed.success) throw new GatewayError(400,"INVALID_REQUEST","Provide an agent ID and a non-empty input.question (up to 2,000 characters).");
  if (idempotencyKey && idempotencyKey.length>128) throw new GatewayError(400,"INVALID_IDEMPOTENCY_KEY","Idempotency-Key must be at most 128 characters.");
  return withDemoStore(async store=>{
    const key=store.keys.find(k=>k.hash===hashSecret(secret) && !k.revokedAt);
    if (!key) throw new GatewayError(401,"INVALID_API_KEY","The API key is missing, invalid, or revoked.");
    const requestHash=hashSecret(JSON.stringify(parsed.data));
    const previous=idempotencyKey && store.runs.find(r=>r.keyId===key.id && r.idempotencyKey===idempotencyKey);
    if(previous) { if(previous.requestHash!==requestHash) throw new GatewayError(409,"IDEMPOTENCY_CONFLICT","This idempotency key was already used for a different request."); return previous; }
    const start=Date.now();
    const textAgent=runnableProjectAgents.find(a=>a.id===parsed.data.agent);
    const selected=parsed.data.agent === "knowledge-support" || textAgent ? null : store.agents.find(a=>a.id===parsed.data.agent&&a.status==="published");
    if(parsed.data.agent!=="knowledge-support"&&!selected&&!textAgent)throw new GatewayError(404,"AGENT_NOT_FOUND","The agent was not found or is not published.");
    if(textAgent && parsed.data.context) throw new GatewayError(400,"UNSUPPORTED_CONTEXT","Discord integration currently supports knowledge-base agents only.");
    let output;
    try{output=textAgent ? await runTextAgent(textAgent,parsed.data.input.question) : selected && selected.runtime!=="knowledge-support-v1" ? await invokeRemoteAgent(selected.endpointUrl,parsed.data.input.question,store.articles) : await generateSupportAnswer(parsed.data.input.question,store.articles);}catch(error){if(error instanceof RemoteAgentError)throw new GatewayError(502,"AGENT_UNAVAILABLE",error.message);throw error;}
    if(output.action==="answer"&&output.sources.some(id=>!store.articles.some(article=>article.id===id)))throw new GatewayError(502,"INVALID_AGENT_RESPONSE","Agent returned a source not present in the knowledge base.");
    const now=new Date().toISOString();
    const ticketId=output.action==="handoff"?randomUUID():null;
    if(ticketId && output.action==="handoff") store.handoffs.unshift({id:ticketId,keyId:key.id,discord:parsed.data.context,question:parsed.data.input.question,reason:output.reason,status:"open",reply:null,createdAt:now});
    const priceMicros=selected?.priceMicros || 0;
    const billing={priceMicros,grossNanos:priceMicros*1000,platformNanos:priceMicros*50,builderNanos:priceMicros*950};
    const run:DemoRun={ billing, id:randomUUID(), keyId:key.id, agent:parsed.data.agent, question:parsed.data.input.question, output, ticketId, latencyMs:Date.now()-start, createdAt:now, idempotencyKey, requestHash };
    store.runs.unshift(run); return run;
  },true);
}
