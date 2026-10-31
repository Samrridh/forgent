import { z } from "zod";

export const EvaluationCategorySchema = z.enum([
  "functional", "schema", "edge_case", "adversarial", "reliability",
]);
export const EvaluationAssertionSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("output_schema") }),
  z.strictObject({ kind: z.literal("json_equals"), path: z.array(z.string().min(1)).max(16), expected: z.json() }),
  z.strictObject({ kind: z.literal("json_exists"), path: z.array(z.string().min(1)).max(16) }),
]);
export const EvaluationCaseSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9_-]{1,64}$/),
  category: EvaluationCategorySchema,
  description: z.string().trim().min(1).max(500),
  input: z.json(),
  assertions: z.array(EvaluationAssertionSchema).min(1).max(10),
});
export const EvaluationPlanSchema = z.strictObject({
  version: z.literal("1"),
  cases: z.array(EvaluationCaseSchema).min(1).max(100),
}).superRefine((plan, context) => {
  const ids = new Set<string>();
  for (const item of plan.cases) {
    if (ids.has(item.id)) context.addIssue({ code: "custom", message: `Duplicate case ID: ${item.id}` });
    ids.add(item.id);
  }
});
export type EvaluationPlan = z.infer<typeof EvaluationPlanSchema>;
