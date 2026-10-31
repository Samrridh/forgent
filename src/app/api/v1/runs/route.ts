import { NextRequest, NextResponse } from "next/server";
import { GatewayError, runAgent } from "@/server/forgent/gateway";
import { ProviderError } from "@/server/forgent/support-agent";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest) {
  const match=req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i);
  if (!match) return NextResponse.json({error:{code:"INVALID_API_KEY",message:"A Bearer API key is required."}},{status:401});
  let body:unknown;
  try { body=await req.json(); } catch { return NextResponse.json({error:{code:"INVALID_JSON",message:"Request body must be valid JSON."}},{status:400}); }
  try {
    const run=await runAgent(match[1],body,req.headers.get("idempotency-key"));
    return NextResponse.json({id:run.id,agent:run.agent,status:"completed",output:run.output,ticket_id:run.ticketId,latency_ms:run.latencyMs,created_at:run.createdAt,billing:{mode:"demo",charged:0,...(run.billing || {priceMicros:0,grossNanos:0,platformNanos:0,builderNanos:0})}});
  } catch(error) {
    if(error instanceof GatewayError) return NextResponse.json({error:{code:error.code,message:error.message}},{status:error.status});
    if(error instanceof ProviderError) return NextResponse.json({error:{code:error.code,message:error.message}},{status:503});
    console.error("Forgent run failed",error);
    return NextResponse.json({error:{code:"INTERNAL_ERROR",message:"The run could not be completed."}},{status:500});
  }
}
