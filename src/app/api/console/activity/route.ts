import { exampleAgents } from "@/data/example-agents";
import { NextResponse } from "next/server";
import { withDemoStore } from "@/server/forgent/demo-store";
export const dynamic="force-dynamic";
export async function GET(){const data=await withDemoStore(store=>({runs:store.runs.map(({id,agent,output,createdAt,latencyMs,ticketId,billing})=>({id,agent,agentName:agent==="knowledge-support"?"Knowledge Support":store.agents.find(a=>a.id===agent)?.name||exampleAgents.find(a=>a.id===agent)?.name||agent,action:output.action,createdAt,latencyMs,ticketId,billing:billing||null})),handoffs:store.handoffs}));return NextResponse.json(data);}
