import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { newKey, publicKey, withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
export const dynamic="force-dynamic";
export async function GET() { return NextResponse.json({keys:await withDemoStore(store=>store.keys.map(publicKey))}); }
export async function POST(req:NextRequest) {
  const denied=rejectCrossOrigin(req);if(denied)return denied;
  const body:unknown=await req.json().catch(()=>null);
  const parsed=z.object({name:z.string().trim().min(1).max(60)}).safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Provide a key name (1–60 characters)."},{status:400});
  const {secret,key}=newKey(parsed.data.name);
  await withDemoStore(store=>{store.keys.unshift(key);},true);
  return NextResponse.json({key:publicKey(key),secret},{status:201});
}
