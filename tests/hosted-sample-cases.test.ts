import { describe, expect, it } from "vitest";
import { HOSTED_SAMPLE_CASES } from "@/lib/contracts/hosted-sample-fixtures";
import { evaluateHostedCases } from "@/server/builder/evaluation/evaluate-hosted-cases";
import { runHostedSample } from "@/server/builder/evaluation/hosted-sample";

describe("platform support sample cases", () => {
  it("matches the sample runtime and returns a meaningful score", async () => {
    const result = await evaluateHostedCases(HOSTED_SAMPLE_CASES, runHostedSample);
    expect(result.cases.map((item) => item.status)).toEqual(["passed", "passed", "passed"]);
    expect(result.scorePercent).toBe(100);
  });
});
