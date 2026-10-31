import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ArticleSchema } from "@/server/forgent/contracts";
const schema=z.object({question:z.string().min(1),articles:z.array(ArticleSchema)});
export async function POST(req:NextRequest){
 const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Expected question and articles."},{status:400});
 const q=parsed.data.question.toLowerCase();let article;
 if(/ignore|override|system prompt|private|secret|api key|refund|invoice|billing|delete|card/.test(q))article=undefined;
 else if(/password|reset/.test(q))article=parsed.data.articles.find(a=>/password/i.test(a.title));
 else if(/notification|preferences/.test(q))article=parsed.data.articles.find(a=>/notification/i.test(a.title));
 else if(/invit|member|team/.test(q))article=parsed.data.articles.find(a=>/member|start/i.test(a.title));
 if(!article)return NextResponse.json({action:"handoff",answer:"I’ll send this question to a person.",reason:"The supplied knowledge base does not answer this question."});
 return NextResponse.json({action:"answer",answer:article.content,sources:[article.id]});
}
