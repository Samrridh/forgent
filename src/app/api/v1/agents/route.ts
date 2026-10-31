import { exampleAgents } from "@/data/example-agents";
import { NextResponse } from "next/server";
import { withDemoStore } from "@/server/forgent/demo-store";
export const dynamic="force-dynamic";
export async function GET(){const published=await withDemoStore(store=>store.agents.filter(a=>a.status==="published").map(a=>({id:a.id,name:a.name,description:a.description,version:a.version,priceMicros:a.priceMicros,evaluation:a.report})));return NextResponse.json({agents:[{id:"knowledge-support",name:"Knowledge Support",version:1,description:"Answers from a knowledge base or creates a human handoff.",input:{question:"string"},billing:"demo; no charges"},...published,...exampleAgents.map(a=>({id:a.id,name:a.name,description:a.description,category:a.category,input:{question:"string"},billing:"demo; no charges",mode:"text-only"}))]});}
