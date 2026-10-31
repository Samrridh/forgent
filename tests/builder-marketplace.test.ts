import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as createAgent } from "@/app/api/console/builder-agents/route";
import { PUT as updateAgent } from "@/app/api/console/builder-agents/[id]/route";
import { POST as runEvaluation } from "@/app/api/console/builder-agents/[id]/evaluate/route";
import { POST as publishAgent } from "@/app/api/console/builder-agents/[id]/publish/route";
import { POST as sampleAgent } from "@/app/api/builder/sample-agent/route";
import { GET as listAgents } from "@/app/api/v1/agents/route";
import { newKey, withDemoStore } from "@/server/forgent/demo-store";
import { runAgent } from "@/server/forgent/gateway";
import { evaluateAgent } from "@/server/forgent/builder-evaluation";
let directory:string;
const endpoint="http://127.0.0.1:3000/api/builder/sample-agent";
const details={name:"Northstar Support",description:"Support answers and human handoff for users.",endpointUrl:endpoint,priceMicros:10000};
function request(body:unknown){return new NextRequest("http://localhost/api/console/builder-agents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});}
function params(id:string){return {params:Promise.resolve({id})};}
beforeAll(async()=>{directory=await mkdtemp(path.join(os.tmpdir(),"forgent-builder-"));process.env.FORGENT_DATA_DIR=directory;});
beforeEach(async()=>{await rm(path.join(directory,"store.json"),{force:true});});
afterEach(()=>vi.restoreAllMocks());
afterAll(async()=>{delete process.env.FORGENT_DATA_DIR;await rm(directory,{recursive:true,force:true});});
describe("builder evaluation and marketplace",()=>{
 it("fails closed for invalid or unreachable endpoints",async()=>{
  const report=await evaluateAgent(endpoint,async()=>{throw new Error("offline");});expect(report.passed).toBe(false);expect(report.cases).toHaveLength(12);expect(report.cases.every(c=>!c.passed)).toBe(true);
  const invalid=await createAgent(request({...details,endpointUrl:"http://192.168.1.1/agent"}));expect(invalid.status).toBe(400);
 });
 it("simulates evaluation, gates publication, routes published runs, and invalidates edits",async()=>{
  const fetchSpy=vi.spyOn(globalThis,"fetch").mockImplementation(async (_input,init)=>sampleAgent(new NextRequest(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:String(init?.body)})));
  const created=await createAgent(request(details));expect(created.status).toBe(201);const {agent}=await created.json();const id:string=agent.id;
  expect((await publishAgent(request({}),params(id))).status).toBe(409);
  const evaluated=await runEvaluation(request({}),params(id));expect(evaluated.status).toBe(200);const result=await evaluated.json();expect(result.agent.report.passed).toBe(true);expect(result.agent.report.answeredPassed).toBe(6);expect(result.agent.report.handoffsPassed).toBe(6);expect(result.agent.report.simulated).toBe(true);expect(fetchSpy).not.toHaveBeenCalled();
  expect((await publishAgent(request({}),params(id))).status).toBe(200);
  const catalog=await (await listAgents()).json();expect(catalog.agents.some((a:{id:string})=>a.id===id)).toBe(true);expect(JSON.stringify(catalog)).not.toContain(endpoint);
  const createdKey=newKey("builder test");await withDemoStore(store=>{store.keys.push(createdKey.key);},true);
  const output=await runAgent(createdKey.secret,{agent:id,input:{question:"How do I invite my team?"}},null);expect(output.output.action).toBe("answer");
  const edited=await updateAgent(new NextRequest(`http://localhost/api/console/builder-agents/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({...details,name:"Updated Support"})}),params(id));expect(edited.status).toBe(200);const updated=await edited.json();expect(updated.agent.status).toBe("draft");expect(updated.agent.report).toBeNull();
  await expect(runAgent(createdKey.secret,{agent:id,input:{question:"How do I invite my team?"}},null)).rejects.toMatchObject({status:404});
 });
});
