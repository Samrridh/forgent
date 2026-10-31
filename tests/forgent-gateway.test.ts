import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { newKey, withDemoStore } from "@/server/forgent/demo-store";
import { runAgent } from "@/server/forgent/gateway";
import { retrieveArticles } from "@/server/forgent/support-agent";
import { NextRequest } from "next/server";
import { POST as postRun } from "@/app/api/v1/runs/route";

let directory:string;
let key:string;
const request=(question:string)=>({agent:"knowledge-support",input:{question}});
beforeAll(async()=>{directory=await mkdtemp(path.join(os.tmpdir(),"forgent-gateway-"));process.env.FORGENT_DATA_DIR=directory;});
beforeEach(async()=>{await rm(path.join(directory,"store.json"),{force:true});const created=newKey("Test key");key=created.secret;await withDemoStore(store=>{store.keys.push(created.key);},true);delete process.env.OPENROUTER_API_KEY;delete process.env.OPENROUTER_API_KEY;delete process.env.GEMINI_API_KEY;delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;delete process.env.OPENAI_API_KEY;});
afterEach(()=>{vi.restoreAllMocks();});
afterAll(async()=>{delete process.env.FORGENT_DATA_DIR;await rm(directory,{recursive:true,force:true});});

describe("Forgent demo gateway",()=>{
 it("stores only key hashes and rejects invalid or revoked credentials",async()=>{
  const file=await readFile(path.join(directory,"store.json"),"utf8");expect(file).not.toContain(key);
  await expect(runAgent("bad",request("Hello"),null)).rejects.toMatchObject({status:401});
  await withDemoStore(store=>{store.keys[0].revokedAt=new Date().toISOString();},true);
  await expect(runAgent(key,request("Hello"),null)).rejects.toMatchObject({status:401});
 });
 it("creates one persistent human handoff for a repeated request",async()=>{
  const first=await runAgent(key,request("Why is my invoice incorrect?"),"retry-1");
  const second=await runAgent(key,request("Why is my invoice incorrect?"),"retry-1");
  expect(first.output.action).toBe("handoff");expect(second.id).toBe(first.id);
  const data=await withDemoStore(store=>({runs:store.runs.length,tickets:store.handoffs.length}));expect(data).toEqual({runs:1,tickets:1});
  await expect(runAgent(key,request("Where is my invoice?"),"retry-1")).rejects.toMatchObject({status:409});
 });
 it("requires a model key for an answerable question and records no fake result",async()=>{
  await expect(runAgent(key,request("How do I invite my team?"),null)).rejects.toMatchObject({code:"MODEL_NOT_CONFIGURED"});
  expect(await withDemoStore(store=>store.runs.length)).toBe(0);
 });
 it("calls the configured provider with matching documents and validates citations",async()=>{
  process.env.OPENROUTER_API_KEY="test-only";
  const fetchSpy=vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({action:"answer",answer:"Open Settings and select Members.",sources:["getting-started"]})}}]}),{status:200,headers:{"Content-Type":"application/json"}}));
  const result=await runAgent(key,request("How do I invite my team?"),null);
  expect(result.output).toMatchObject({action:"answer",sources:["getting-started"]});
  expect(fetchSpy).toHaveBeenCalledOnce();
  expect(fetchSpy.mock.calls[0][0]).toBe("https://openrouter.ai/api/v1/chat/completions");
  expect(String(fetchSpy.mock.calls[0][1]?.body)).toContain("openrouter/free");
  expect(String(fetchSpy.mock.calls[0][1]?.body)).toContain("getting-started");
 });
 it("rejects fabricated source IDs and does not record a successful run",async()=>{
  process.env.OPENROUTER_API_KEY="test-only";
  vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({action:"answer",answer:"Wrong.",sources:["unknown"]})}}]}),{status:200}));
  await expect(runAgent(key,request("How do I invite my team?"),null)).rejects.toMatchObject({code:"INVALID_MODEL_RESPONSE"});
  expect(await withDemoStore(store=>store.runs.length)).toBe(0);
 });
 it("runs a formerly preview-only catalog agent",async()=>{
  process.env.OPENROUTER_API_KEY="test-only";
  const fetchSpy=vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:"Draft review"}}]}),{status:200}));
  const result=await runAgent(key,{agent:"example-code-review",input:{question:"Review this code."}},null);
  expect(result.output).toEqual({action:"result",answer:"Draft review"});expect(fetchSpy).toHaveBeenCalledOnce();
 });
 it("exposes authenticated API responses without leaking stored key metadata",async()=>{
  const missing=await postRun(new NextRequest("http://localhost/api/v1/runs",{method:"POST",body:JSON.stringify(request("unrelated invoice"))}));
  expect(missing.status).toBe(401);
  const response=await postRun(new NextRequest("http://localhost/api/v1/runs",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify(request("Why is my invoice incorrect?"))}));
  expect(response.status).toBe(200);
  const body=await response.json();expect(body.output.action).toBe("handoff");expect(body.ticket_id).toBeTruthy();expect(body.keyId).toBeUndefined();expect(body.billing).toMatchObject({mode:"demo",charged:0,grossNanos:0,platformNanos:0,builderNanos:0});
 });
 it("retrieves matching articles and avoids returning documents for an unrelated question",()=>{
  const articles=[{id:"a",title:"Invite members",content:"Open Settings to invite your team."}];
  expect(retrieveArticles("How do I invite the team?",articles)).toHaveLength(1);
  expect(retrieveArticles("Where is my invoice?",articles)).toHaveLength(0);
 });
});
