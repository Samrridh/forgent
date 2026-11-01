import { z } from "zod";
const outputSchema=z.discriminatedUnion("action",[z.object({action:z.literal("answer"),answer:z.string(),sources:z.array(z.string())}),z.object({action:z.literal("handoff"),answer:z.string(),reason:z.string()})]);
const runSchema=z.object({id:z.string(),output:outputSchema,ticket_id:z.string().nullable()});
const ticketSchema=z.object({ticket:z.object({id:z.string(),status:z.enum(["open","resolved"]),discord:z.object({guildId:z.string(),channelId:z.string(),messageId:z.string(),userId:z.string()})})});
export interface DiscordMessageContext {guildId:string;channelId:string;messageId:string;userId:string}
export class ForgentDiscordGateway {
 constructor(private apiKey:string,private baseUrl="http://127.0.0.1:3000"){this.baseUrl=this.baseUrl.replace(/\/+$/, "");}
 private async request(path:string,init:RequestInit={}) {const response=await fetch(`${this.baseUrl}${path}`,{...init,headers:{Authorization:`Bearer ${this.apiKey}`,"Content-Type":"application/json",...init.headers},signal:AbortSignal.timeout(35000)});if(!response.ok)throw new Error(`Forgent API returned HTTP ${response.status}`);return response.json() as Promise<unknown>;}
 async run(agentId:string,question:string,context:DiscordMessageContext){return runSchema.parse(await this.request("/api/v1/runs",{method:"POST",headers:{"Idempotency-Key":`discord-${context.messageId}`},body:JSON.stringify({agent:agentId,input:{question},context:{source:"discord",...context}})}));}
 async ticket(id:string){return ticketSchema.parse(await this.request(`/api/v1/handoffs/${encodeURIComponent(id)}`)).ticket;}
 async resolve(id:string,reply:string){return this.request(`/api/v1/handoffs/${encodeURIComponent(id)}`,{method:"PATCH",body:JSON.stringify({reply})});}
 async heartbeat(details:{guildId:string;supportChannelId:string;staffChannelId:string;agentId:string}){return this.request("/api/v1/discord/heartbeat",{method:"POST",body:JSON.stringify(details)});}
}
