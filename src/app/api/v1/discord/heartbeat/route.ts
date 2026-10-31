import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateKey } from "@/server/forgent/api-auth";
import { withDemoStore } from "@/server/forgent/demo-store";
const schema=z.object({guildId:z.string().regex(/^\d{16,22}$/),supportChannelId:z.string().regex(/^\d{16,22}$/),staffChannelId:z.string().regex(/^\d{16,22}$/),agentId:z.string().min(1).max(100)});
export async function POST(req:NextRequest){const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Invalid connection details."},{status:400});const saved=await withDemoStore(store=>{if(!authenticateKey(req,store))return false;store.discordStatus={...parsed.data,lastSeenAt:new Date().toISOString()};return true;},true);return saved?NextResponse.json({ok:true}):NextResponse.json({error:"Invalid API key."},{status:401});}
