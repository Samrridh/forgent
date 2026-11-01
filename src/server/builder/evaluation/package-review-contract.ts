import { z } from "zod";

export const ReviewFindingSchema = z.strictObject({
  category: z.enum(["contract", "functionality", "reliability", "security", "maintainability"]),
  severity: z.enum(["high", "medium", "low", "info"]),
  summary: z.string().trim().min(1).max(500),
  evidence: z.string().trim().min(1).max(1000),
  recommendation: z.string().trim().min(1).max(1000),
});
const jsonTextSchema = z.string().trim().min(1).max(8000).refine((value) => {
  try { JSON.parse(value); return true; } catch { return false; }
}, "Must be valid JSON");
export const ProposedTestSchema = z.strictObject({
  title: z.string().trim().min(1).max(120),
  category: z.enum(["functional", "schema", "edge_case", "adversarial", "reliability"]),
  purpose: z.string().trim().min(1).max(500),
  inputJson: jsonTextSchema,
  expectedJson: jsonTextSchema,
  expectation: z.string().trim().min(1).max(1000),
});
export const HostedEvaluationSummarySchema = z.strictObject({
  evaluatedAt: z.string().datetime(),
  executionMode: z.enum(["hosted_endpoint", "platform_sample"]).optional(),
  passed: z.number().int().nonnegative(), failed: z.number().int().nonnegative(),
  unsupported: z.number().int().nonnegative(), errors: z.number().int().nonnegative(),
  scorePercent: z.number().int().min(0).max(100).nullable(),
  approvedCases: z.array(ProposedTestSchema).max(5),
  cases: z.array(z.strictObject({ title: z.string().max(120), status: z.enum(["passed", "failed", "unsupported", "error"]), detail: z.string().max(500) })).max(5),
});
export const PackageReviewSchema = z.strictObject({
  summary: z.string().trim().min(1).max(2000),
  findings: z.array(ReviewFindingSchema).max(30),
  limitations: z.array(z.string().trim().min(1).max(500)).min(1).max(12),
  proposedTests: z.array(ProposedTestSchema).max(20),
  evaluation: HostedEvaluationSummarySchema.optional(),
});
export type PackageReview = z.infer<typeof PackageReviewSchema>;
export type ProposedTest = z.infer<typeof ProposedTestSchema>;
