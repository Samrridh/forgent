import type { DemoListing } from "./demo-listing-contract";
import { z } from "zod";
export const ArticleSchema = z.object({ id: z.string().min(1), title: z.string().min(1).max(120), content: z.string().min(1).max(10000) });
export const ArticleInputSchema = ArticleSchema.omit({ id: true });
export type Article = z.infer<typeof ArticleSchema>;
export const DiscordContextSchema = z.object({ source:z.literal("discord"), guildId:z.string().regex(/^\d{16,22}$/), channelId:z.string().regex(/^\d{16,22}$/), messageId:z.string().regex(/^\d{16,22}$/), userId:z.string().regex(/^\d{16,22}$/) });
export type DiscordContext = z.infer<typeof DiscordContextSchema>;
export const RunInputSchema = z.object({ agent: z.string().min(1).max(100), input: z.object({ question: z.string().trim().min(1).max(2000) }), context:DiscordContextSchema.optional() });
export const AgentOutputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("result"), answer: z.string().min(1).max(12000) }),
  z.object({ action: z.literal("answer"), answer: z.string().min(1).max(4000), sources: z.array(z.string().min(1)).min(1) }),
  z.object({ action: z.literal("handoff"), answer: z.string().min(1).max(1000), reason: z.string().min(1).max(1000) }),
]);
export type AgentOutput = z.infer<typeof AgentOutputSchema>;
export interface DemoKey { id: string; name: string; prefix: string; hash: string; createdAt: string; revokedAt: string | null }
export interface DemoBilling { priceMicros:number; grossNanos:number; platformNanos:number; builderNanos:number }
export interface DemoRun { billing?:DemoBilling; id: string; keyId: string; agent: string; question: string; output: AgentOutput; ticketId: string | null; latencyMs: number; createdAt: string; idempotencyKey: string | null; requestHash: string }
export interface Handoff { keyId?:string; discord?:DiscordContext; id: string; question: string; reason: string; status: "open" | "resolved"; reply: string | null; createdAt: string }
export interface EvaluationCase { id:string; name:string; passed:boolean; detail:string; latencyMs:number }
export interface EvaluationReport { simulated?:boolean; testedAt:string; passed:boolean; cases:EvaluationCase[]; answeredPassed:number; handoffsPassed:number }
export interface BuilderAgent { id:string; name:string; description:string; endpointUrl:string; runtime?:"knowledge-support-v1"; priceMicros:number; version:number; status:"draft"|"passed"|"failed"|"published"; report:EvaluationReport|null; createdAt:string }
export interface DiscordStatus { guildId:string; supportChannelId:string; staffChannelId:string; agentId:string; lastSeenAt:string }
export interface DemoStore { demoListings?: DemoListing[]; discordStatus?:DiscordStatus|null; agents:BuilderAgent[]; version: 1; keys: DemoKey[]; articles: Article[]; runs: DemoRun[]; handoffs: Handoff[] }
