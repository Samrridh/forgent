import { NextRequest, NextResponse } from "next/server";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const denied=rejectCrossOrigin(req);if(denied)return denied;
  const {id}=await params;
  const found=await withDemoStore(store=>{const key=store.keys.find(k=>k.id===id);if(!key)return false;key.revokedAt=new Date().toISOString();return true;},true);
  return found?NextResponse.json({revoked:true}):NextResponse.json({error:"Key not found."},{status:404});
}
