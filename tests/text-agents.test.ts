import { afterEach, describe, expect, it, vi } from "vitest";
import { runnableProjectAgents } from "@/data/project-example-agents";
import { runTextAgent } from "@/server/forgent/text-agent";
const previousKey=process.env.OPENROUTER_API_KEY;
afterEach(()=>{vi.restoreAllMocks();if(previousKey===undefined)delete process.env.OPENROUTER_API_KEY;else process.env.OPENROUTER_API_KEY=previousKey});
describe("text agent adaptations",()=>{
 it("offers exactly 60 distinct agent IDs",()=>{expect(runnableProjectAgents).toHaveLength(60);expect(new Set(runnableProjectAgents.map(a=>a.id)).size).toBe(60)});
 it("sends the selected task and supplied input to the free router",async()=>{process.env.OPENROUTER_API_KEY="test-key";const spy=vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response(JSON.stringify({choices:[{message:{content:"Draft response"}}]}),{status:200}));const agent=runnableProjectAgents[0];expect(await runTextAgent(agent,"Test request")).toEqual({action:"result",answer:"Draft response"});const body=JSON.parse(String(spy.mock.calls[0][1]?.body));expect(body.model).toBe("openrouter/free");expect(body.messages[0].content).toContain(agent.name);expect(body.messages[1].content).toBe("Test request")});
 it("returns a clear provider error",async()=>{process.env.OPENROUTER_API_KEY="test-key";vi.spyOn(globalThis,"fetch").mockResolvedValue(new Response("",{status:429}));await expect(runTextAgent(runnableProjectAgents[0],"Test request")).rejects.toMatchObject({code:"MODEL_UNAVAILABLE"})});
});
