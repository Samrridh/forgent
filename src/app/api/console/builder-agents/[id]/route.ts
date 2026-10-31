import { NextRequest, NextResponse } from "next/server";
import { BuilderInputSchema } from "@/server/forgent/builder-contracts";
import { validateEndpoint } from "@/server/forgent/remote-agent";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
export async function PUT(req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const denied=rejectCrossOrigin(req);if(denied)return denied;const parsed=BuilderInputSchema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Provide valid agent details."},{status:400});
 try{await validateEndpoint(parsed.data.endpointUrl);}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Invalid endpoint."},{status:400});}
 const {id}=await params;const agent=await withDemoStore(store=>{const item=store.agents.find(a=>a.id===id);if(!item)return null;Object.assign(item,parsed.data,{version:item.version+1,status:"draft",report:null});return item;},true);
 return agent?NextResponse.json({agent}):NextResponse.json({error:"Agent not found."},{status:404});
}
