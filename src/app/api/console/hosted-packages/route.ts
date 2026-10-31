import { randomUUID } from "node:crypto";
import JSZip from "jszip";
import { NextRequest, NextResponse } from "next/server";
import { HostedManifestSchema, hostedInputSchema, hostedOutputSchema } from "@/server/forgent/hosted-package";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
import { withDemoStore } from "@/server/forgent/demo-store";
import type { BuilderAgent } from "@/server/forgent/contracts";
export const dynamic = "force-dynamic";
export async function POST(req:NextRequest){
 const denied=rejectCrossOrigin(req); if(denied)return denied;
 if(Number(req.headers.get("content-length")||0)>270000)return NextResponse.json({error:"Package is too large (maximum 256 KB)."},{status:413});
 try {
  const form=await req.formData(); const file=form.get("package");
  if(!(file instanceof File)||file.size>262144||file.size===0)return NextResponse.json({error:"Choose a ZIP package under 256 KB."},{status:400});
  const zip=await JSZip.loadAsync(await file.arrayBuffer());
  const entries=Object.values(zip.files);
  if(entries.length!==1||entries[0].name!=="manifest.json"||entries[0].dir)return NextResponse.json({error:"Package must contain only manifest.json at its root."},{status:400});
  const entry=entries[0] as typeof entries[number] & {_data?:{uncompressedSize?:number}};
  if(typeof entry._data?.uncompressedSize!=="number"||entry._data.uncompressedSize>16384)return NextResponse.json({error:"Manifest exceeds the 16 KB limit."},{status:400});
  const manifest=HostedManifestSchema.safeParse(JSON.parse(await entries[0].async("string")));
  if(!manifest.success)return NextResponse.json({error:"Invalid manifest. Use the sample package and supported knowledge-support-v1 runtime."},{status:400});
  const agent:BuilderAgent={id:`agent-${randomUUID()}`,name:manifest.data.name,description:manifest.data.description,priceMicros:manifest.data.priceMicros,endpointUrl:"",runtime:"knowledge-support-v1",version:1,status:"draft",report:null,createdAt:new Date().toISOString()};
  await withDemoStore(store=>{store.agents.unshift(agent)},true);
  return NextResponse.json({agent,inputSchema:hostedInputSchema,outputSchema:hostedOutputSchema},{status:201});
 }catch{return NextResponse.json({error:"Could not read package. Upload a valid sample ZIP."},{status:400});}
}
