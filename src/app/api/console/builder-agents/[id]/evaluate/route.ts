import { NextRequest, NextResponse } from "next/server";
import { simulateEvaluation } from "@/server/forgent/simulated-evaluation";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const denied=rejectCrossOrigin(req);if(denied)return denied;const {id}=await params;
 const snapshot=await withDemoStore(store=>store.agents.find(a=>a.id===id));if(!snapshot)return NextResponse.json({error:"Agent not found."},{status:404});
 const report=await simulateEvaluation();
 const agent=await withDemoStore(store=>{const item=store.agents.find(a=>a.id===id);if(!item||item.version!==snapshot.version)return null;item.report=report;item.status=report.passed?"passed":"failed";return item;},true);
 return agent?NextResponse.json({agent}):NextResponse.json({error:"Agent changed during evaluation; run it again."},{status:409});
}
