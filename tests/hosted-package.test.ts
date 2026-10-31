import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import JSZip from "jszip";
import { POST as upload } from "@/app/api/console/hosted-packages/route";
import { POST as evaluate } from "@/app/api/console/builder-agents/[id]/evaluate/route";
import { POST as streamEvaluation } from "@/app/api/console/builder-agents/[id]/evaluate/stream/route";
import { POST as publish } from "@/app/api/console/builder-agents/[id]/publish/route";
import { newKey, withDemoStore } from "@/server/forgent/demo-store";
import { runAgent } from "@/server/forgent/gateway";
let dir:string;
beforeAll(async()=>{dir=await mkdtemp(path.join(os.tmpdir(),"forgent-hosted-"));process.env.FORGENT_DATA_DIR=dir;process.env.OPENROUTER_API_KEY="test-key"});
afterEach(()=>vi.restoreAllMocks());
afterAll(async()=>{delete process.env.FORGENT_DATA_DIR;delete process.env.OPENROUTER_API_KEY;await rm(dir,{recursive:true,force:true})});
function request(form:FormData){return new NextRequest("http://localhost:3000/api/console/hosted-packages",{method:"POST",body:form})}
describe("hosted support packages",()=>{
 it("rejects a ZIP with executable files",async()=>{const zip=new JSZip();zip.file("manifest.json","{}");zip.file("agent.js","throw Error()");const form=new FormData();form.set("package",new File([new Uint8Array(await zip.generateAsync({type:"uint8array"})).buffer],"agent.zip"));expect((await upload(request(form))).status).toBe(400)});
 it("uploads the sample, detects its interface, evaluates, publishes, and runs it",async()=>{
  const zip=await readFile(path.join(process.cwd(),"public/samples/support-agent.zip"));const form=new FormData();form.set("package",new File([zip],"support-agent.zip"));
  const result=await upload(request(form));expect(result.status).toBe(201);const body=await result.json();expect(body.inputSchema.properties.question.type).toBe("string");const id=body.agent.id as string;
  const fetchSpy=vi.spyOn(globalThis,"fetch").mockImplementation(async(_url,init)=>{const payload=JSON.parse(String(init?.body)) as {messages:{content:string}[]};const text=payload.messages[0].content.split("Question and articles: ")[1];const data=JSON.parse(text) as {articles:{id:string;content:string}[]};return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({action:"answer",answer:data.articles[0].content,sources:[data.articles[0].id]})}}]}),{status:200})});
  const streamed=await streamEvaluation(new NextRequest("http://localhost:3000/",{method:"POST"}),{params:Promise.resolve({id})});const events=(await streamed.text()).trim().split("\n").map(line=>JSON.parse(line) as {type:string;completed?:number});expect(events.filter(event=>event.type==="progress")).toHaveLength(12);expect(events.find(event=>event.type==="complete")).toBeTruthy();expect(events.filter(event=>event.type==="progress").at(-1)?.completed).toBe(12);
  const params=Promise.resolve({id});const evaluated=await evaluate(new NextRequest("http://localhost:3000/",{method:"POST"}),{params});const evaluation=await evaluated.json();expect(evaluation.agent.report.passed).toBe(true);expect(evaluation.agent.report.simulated).toBe(true);expect(fetchSpy).not.toHaveBeenCalled();
  expect((await publish(new NextRequest("http://localhost:3000/",{method:"POST"}),{params:Promise.resolve({id})})).status).toBe(200);
  const key=newKey("test");await withDemoStore(store=>{store.keys.push(key.key)},true);const run=await runAgent(key.secret,{agent:id,input:{question:"How do I invite my team?"}},null);expect(run.output.action).toBe("answer");
 });
});
