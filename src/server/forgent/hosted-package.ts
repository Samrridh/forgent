import { z } from "zod";

// This package selects a built-in runtime; it never executes uploaded code.
export const HostedManifestSchema = z.object({
  format: z.literal("forgent-agent-v1"), runtime: z.literal("knowledge-support-v1"),
  name: z.string().trim().min(3).max(80), description: z.string().trim().min(10).max(500),
  priceMicros: z.number().int().min(0).max(1000000),
}).strict();
export const hostedInputSchema = { type:"object", properties:{ question:{ type:"string", minLength:1, maxLength:2000 } }, required:["question"], additionalProperties:false };
export const hostedOutputSchema = { oneOf:[
  { type:"object", properties:{ action:{const:"answer"}, answer:{type:"string"}, sources:{type:"array",items:{type:"string"}} }, required:["action","answer","sources"] },
  { type:"object", properties:{ action:{const:"handoff"}, answer:{type:"string"}, reason:{type:"string"} }, required:["action","answer","reason"] },
] };
