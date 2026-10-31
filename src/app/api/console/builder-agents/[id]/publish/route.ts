import { NextRequest, NextResponse } from "next/server";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const denied=rejectCrossOrigin(req);if(denied)return denied;const {id}=await params;
 const result=await withDemoStore(store=>{const agent=store.agents.find(a=>a.id===id);if(!agent)return "missing";if(agent.status!=="passed"||!agent.report?.passed)return "not_passed";agent.status="published";return "published";},true);
 if(result==="missing")return NextResponse.json({error:"Agent not found."},{status:404});if(result!=="published")return NextResponse.json({error:"Run and pass the evaluation first."},{status:409});return NextResponse.json({published:true});
}
