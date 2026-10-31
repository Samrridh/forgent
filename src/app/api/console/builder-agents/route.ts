import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { BuilderInputSchema } from "@/server/forgent/builder-contracts";
import { validateEndpoint } from "@/server/forgent/remote-agent";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
import type { BuilderAgent } from "@/server/forgent/contracts";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({agents:await withDemoStore(store=>store.agents)});}
export async function POST(req:NextRequest){
 const denied=rejectCrossOrigin(req);if(denied)return denied;
 const parsed=BuilderInputSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Provide a name, description, valid endpoint URL, and a valid USD price."},{status:400});
 try{await validateEndpoint(parsed.data.endpointUrl);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid endpoint."},{status:400});}
 const agent:BuilderAgent={id:`agent-${randomUUID()}`, ...parsed.data, version:1,status:"draft",report:null,createdAt:new Date().toISOString()};
 await withDemoStore(store=>{store.agents.unshift(agent);},true);return NextResponse.json({agent},{status:201});
}
