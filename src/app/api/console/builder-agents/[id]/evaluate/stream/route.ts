import { NextRequest, NextResponse } from "next/server";
import { simulateEvaluation } from "@/server/forgent/simulated-evaluation";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const denied=rejectCrossOrigin(req);if(denied)return denied;const {id}=await params;const snapshot=await withDemoStore(store=>store.agents.find(item=>item.id===id));if(!snapshot)return NextResponse.json({error:"Agent not found."},{status:404});
 const encoder=new TextEncoder();const stream=new ReadableStream({async start(controller){let open=true;const send=(event:unknown)=>{if(open)try{controller.enqueue(encoder.encode(JSON.stringify(event)+"\n"))}catch{open=false}};
 try{send({type:"start",total:12});
 const report=await simulateEvaluation((result,completed,total)=>send({type:"progress",result,completed,total}));
 const saved=await withDemoStore(store=>{const item=store.agents.find(a=>a.id===id);if(!item||item.version!==snapshot.version)return false;item.report=report;item.status=report.passed?"passed":"failed";return true},true);
 if(!saved)send({type:"error",message:"Agent changed during evaluation. Run it again."});else send({type:"complete",report});
 }catch{send({type:"error",message:"Evaluation could not be completed."})}finally{if(open)controller.close()}
 }});return new Response(stream,{headers:{"Content-Type":"application/x-ndjson","Cache-Control":"no-store, no-transform"}});
}
