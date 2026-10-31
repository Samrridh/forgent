import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { POST as sampleAgent } from "@/app/api/builder/sample-agent/route";
import { GET as getTicket, PATCH as resolveTicket } from "@/app/api/v1/handoffs/[id]/route";
import { PATCH as resolveInConsole } from "@/app/api/console/handoffs/[id]/route";
import { POST as heartbeat } from "@/app/api/v1/discord/heartbeat/route";
import { GET as discordStatus } from "@/app/api/console/discord-status/route";
import { newKey, withDemoStore } from "@/server/forgent/demo-store";
import { runAgent } from "@/server/forgent/gateway";
import { ForgentDiscordGateway } from "@/discord/discord-gateway";
import type { BuilderAgent } from "@/server/forgent/contracts";
let directory:string;let secret:string;let otherSecret:string;
const endpoint="http://127.0.0.1:3000/api/builder/sample-agent";
const context={source:"discord" as const,guildId:"123456789012345678",channelId:"223456789012345678",messageId:"323456789012345678",userId:"423456789012345678"};
function req(url:string,method:string,token:string,body?:unknown){return new NextRequest(url,{method,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{})});}
function params(id:string){return {params:Promise.resolve({id})};}
beforeAll(async()=>{directory=await mkdtemp(path.join(os.tmpdir(),"forgent-discord-"));process.env.FORGENT_DATA_DIR=directory;});
beforeEach(async()=>{await rm(path.join(directory,"store.json"),{force:true});const key=newKey("Discord");const other=newKey("Other");secret=key.secret;otherSecret=other.secret;const agent:BuilderAgent={id:"sample",name:"Sample",description:"A test support agent.",endpointUrl:endpoint,priceMicros:10000,version:1,status:"published",report:null,createdAt:new Date().toISOString()};await withDemoStore(store=>{store.keys.push(key.key,other.key);store.agents.push(agent);},true);vi.spyOn(globalThis,"fetch").mockImplementation(async (_url,init)=>sampleAgent(new NextRequest(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:String(init?.body)})));});
afterEach(()=>vi.restoreAllMocks());afterAll(async()=>{delete process.env.FORGENT_DATA_DIR;await rm(directory,{recursive:true,force:true});});
describe("Discord handoffs and demo usage",()=>{
 it("snapshots the 95/5 split exactly and does not double count retries",async()=>{const body={agent:"sample",input:{question:"How do I invite my team?"},context};const first=await runAgent(secret,body,"discord-message-1");const second=await runAgent(secret,body,"discord-message-1");expect(first.id).toBe(second.id);expect(first.billing).toEqual({priceMicros:10000,grossNanos:10000000,platformNanos:500000,builderNanos:9500000});await withDemoStore(store=>{store.agents[0].priceMicros=20000;},true);expect((await withDemoStore(store=>store.runs[0])).billing?.priceMicros).toBe(10000);expect(await withDemoStore(store=>store.runs.length)).toBe(1);});
 it("accounts for sub-cent pricing without losing the 5% share",async()=>{await withDemoStore(store=>{store.agents[0].priceMicros=1;},true);const run=await runAgent(secret,{agent:"sample",input:{question:"How do I invite my team?"}},null);expect(run.billing).toMatchObject({grossNanos:1000,platformNanos:50,builderNanos:950});});
 it("allows only the originating key to read and resolve Discord handoffs",async()=>{const run=await runAgent(secret,{agent:"sample",input:{question:"Why is my invoice wrong?"},context},"discord-323");const id=run.ticketId!;expect((await getTicket(req(`http://localhost/api/v1/handoffs/${id}`,"GET",otherSecret),params(id))).status).toBe(404);expect((await getTicket(req(`http://localhost/api/v1/handoffs/${id}`,"GET",secret),params(id))).status).toBe(200);expect((await resolveInConsole(req(`http://localhost/api/console/handoffs/${id}`,"PATCH",secret,{reply:"test"}),params(id))).status).toBe(409);expect((await resolveTicket(req(`http://localhost/api/v1/handoffs/${id}`,"PATCH",secret,{reply:"A human response"}),params(id))).status).toBe(200);expect((await resolveTicket(req(`http://localhost/api/v1/handoffs/${id}`,"PATCH",secret,{reply:"duplicate"}),params(id))).status).toBe(409);});
 it("authenticates bot heartbeats and shows connection status",async()=>{const data={guildId:context.guildId,supportChannelId:context.channelId,staffChannelId:"523456789012345678",agentId:"sample"};expect((await heartbeat(req("http://localhost/api/v1/discord/heartbeat","POST","invalid",data))).status).toBe(401);expect((await heartbeat(req("http://localhost/api/v1/discord/heartbeat","POST",secret,data))).status).toBe(200);const body=await (await discordStatus()).json();expect(body.connected).toBe(true);expect(body.status.agentId).toBe("sample");});
 it("sends Discord context and idempotency key through the gateway client",async()=>{const spy=vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({id:"run",ticket_id:null,output:{action:"answer",answer:"ok",sources:["a"]}}),{status:200}));const gateway=new ForgentDiscordGateway("test-key");await gateway.run("sample","question",context);const init=spy.mock.calls[0][1];expect(init?.headers).toMatchObject({"Idempotency-Key":`discord-${context.messageId}`});expect(JSON.parse(String(init?.body)).context).toMatchObject(context);});
});
