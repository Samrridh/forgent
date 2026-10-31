import { NextRequest, NextResponse } from "next/server";
import { ArticleInputSchema } from "@/server/forgent/contracts";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const denied=rejectCrossOrigin(req);if(denied)return denied;
  const {id}=await params;const body:unknown=await req.json().catch(()=>null);const parsed=ArticleInputSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Title and article content are required."},{status:400});
  const article=await withDemoStore(store=>{const item=store.articles.find(a=>a.id===id);if(!item)return null;Object.assign(item,parsed.data);return item;},true);
  return article?NextResponse.json({article}):NextResponse.json({error:"Article not found."},{status:404});
}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  const denied=rejectCrossOrigin(req);if(denied)return denied;
  const {id}=await params;const removed=await withDemoStore(store=>{const index=store.articles.findIndex(a=>a.id===id);if(index<0)return false;store.articles.splice(index,1);return true;},true);
  return removed?NextResponse.json({deleted:true}):NextResponse.json({error:"Article not found."},{status:404});
}
