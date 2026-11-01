import { z } from "zod";
import { PackageReviewSchema } from "@/server/builder/evaluation/package-review-contract";

export const MarketplaceListingInputSchema = z.strictObject({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(20).max(2000),
  category: z.string().trim().min(1).max(80),
  endpointUrl: z.string().url().max(2048),
  inputSchema: z.record(z.string(), z.json()),
  outputSchema: z.record(z.string(), z.json()),
  pricePaise: z.number().int().min(0).max(100000000),
  review: PackageReviewSchema,
}).superRefine((listing, context) => {
  const evaluation = listing.review.evaluation;
  if (!evaluation || evaluation.scorePercent === null || evaluation.cases.length !== evaluation.approvedCases.length) {
    context.addIssue({ code: "custom", message: "A scorable demo evaluation is required." });
    return;
  }
  const count = (status: string) => evaluation.cases.filter((item) => item.status === status).length;
  const passed = count("passed"); const failed = count("failed");
  if (evaluation.passed !== passed || evaluation.failed !== failed || evaluation.errors !== count("error") || evaluation.unsupported !== count("unsupported") || !passed && !failed || evaluation.scorePercent !== Math.round(100 * passed / (passed + failed))) {
    context.addIssue({ code: "custom", message: "Evaluation totals are inconsistent." });
  }
});
export const MarketplaceOrderInputSchema = z.strictObject({
  listingId: z.string().min(1).max(100),
  requestId: z.string().uuid(),
  task: z.string().trim().min(5).max(4000),
  paymentMode: z.literal("DEMO_BYPASS"),
});
