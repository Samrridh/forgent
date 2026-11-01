import { z } from "zod";
import { BusinessSchemaDescriptionSchema } from "./business-schema-description";

export const BusinessRequestSchema = z.object({
  objective: z.string().trim().min(10).max(4000),
  schema: z.string().max(200000).default(""),
  inputs: z.string().trim().max(2000).default(""),
  outputs: z.string().trim().max(2000).default(""),
  rules: z.string().trim().max(2000).default(""),
  constraints: z.string().trim().max(2000).default(""),
  answers: z.array(z.strictObject({ question: z.string().trim().min(1).max(500), answer: z.string().trim().min(1).max(2000) })).max(8).default([]),
}).strict();
export type BusinessRequest = z.infer<typeof BusinessRequestSchema>;
export const CompilerAgentSchema = z.object({
  id: z.string(), name: z.string(), summary: z.string(), capabilities: z.array(z.string()),
  permissions: z.array(z.string()), limitations: z.array(z.string()), pricePaise: z.number().int().nonnegative(),
  latencyMs: z.number().int().nonnegative(), inputSchema: z.unknown().nullable(), outputSchema: z.unknown().nullable(),
});
export type CompilerAgent = z.infer<typeof CompilerAgentSchema>;
export const OpenRouterRecommendationSchema = z.strictObject({
  questions: z.array(z.string().trim().min(1).max(500)).max(8),
  candidates: z.array(z.strictObject({
    title: z.string().trim().min(1).max(120),
    rationale: z.string().trim().min(1).max(1500),
    agentIds: z.array(z.string().trim().min(1).max(200)).min(1).max(5),
    warnings: z.array(z.string().trim().min(1).max(500)).max(10),
  })).max(8),
});
export const CandidateSchema = z.object({
  id: z.string(), title: z.string(), rationale: z.string(),
  agentIds: z.array(z.string()).min(1).max(5), warnings: z.array(z.string()),
});
export const CompilerOutputSchema = z.object({
  description: BusinessSchemaDescriptionSchema,
  questions: z.array(z.string()),
  candidates: z.array(CandidateSchema),
  agents: z.array(CompilerAgentSchema),
  mode: z.enum(["openrouter", "offline"]),
  notices: z.array(z.string()),
});
export type CompilerOutput = z.infer<typeof CompilerOutputSchema>;
