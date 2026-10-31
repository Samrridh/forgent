import { z } from "zod";
import { PackageReviewSchema } from "@/server/builder/evaluation/package-review-contract";

export const DemoListingInputSchema = z.strictObject({
  name: z.string().trim().min(3).max(80),
  description: z.string().trim().min(20).max(2000),
  category: z.string().trim().min(1).max(80),
  pricePaise: z.number().int().min(0).max(100000000),
  report: PackageReviewSchema,
});
export const DemoListingSchema = DemoListingInputSchema.extend({ id: z.string().uuid(), createdAt: z.string().datetime() });
export type DemoListing = z.infer<typeof DemoListingSchema>;
