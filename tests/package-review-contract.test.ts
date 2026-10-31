import { describe, expect, it } from "vitest";
import { PackageReviewSchema } from "@/server/builder/evaluation/package-review-contract";
const test = { title: "Empty input", category: "edge_case", purpose: "Check empty input", inputJson: "{}", expectedJson: "null", expectation: "An error is expected; exact error is unknown." };
const report = { summary: "Static inspection", findings: [], limitations: ["Not run"], proposedTests: [test] };
describe("structured package review", () => {
  it("accepts a structured unexecuted case", () => expect(PackageReviewSchema.safeParse(report).success).toBe(true));
  it("rejects malformed JSON and unexpected fields", () => {
    expect(PackageReviewSchema.safeParse({ ...report, proposedTests: [{ ...test, inputJson: "{" }] }).success).toBe(false);
    expect(PackageReviewSchema.safeParse({ ...report, proposedTests: [{ ...test, passed: true }] }).success).toBe(false);
  });
});
