import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ArticleInputSchema } from "@/server/forgent/contracts";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
export const dynamic="force-dynamic";
export async function GET() { return NextResponse.json({articles:await withDemoStore(store=>store.articles)}); }
export async function POST(req:NextRequest) {
  const denied=rejectCrossOrigin(req);if(denied)return denied;
  const body:unknown=await req.json().catch(()=>null);const parsed=ArticleInputSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Title and article content are required."},{status:400});
  const article={id:randomUUID(),...parsed.data};await withDemoStore(store=>{store.articles.push(article);},true);
  return NextResponse.json({article},{status:201});
}
