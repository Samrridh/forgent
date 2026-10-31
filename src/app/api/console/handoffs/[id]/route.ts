import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const denied=rejectCrossOrigin(req);if(denied)return denied;
  const {id}=await params;const parsed=z.object({reply:z.string().trim().min(1).max(4000)}).safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Provide a reply."},{status:400});
  const ticket=await withDemoStore(store=>{const item=store.handoffs.find(t=>t.id===id);if(!item)return null;if(item.discord)return "discord" as const;item.status="resolved";item.reply=parsed.data.reply;return item;},true);
  if(ticket==="discord")return NextResponse.json({error:"Reply to Discord handoffs with /reply in the configured staff channel."},{status:409});
  return ticket?NextResponse.json({ticket}):NextResponse.json({error:"Handoff not found."},{status:404});
}
