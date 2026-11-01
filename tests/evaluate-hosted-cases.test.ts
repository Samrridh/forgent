import { describe, expect, it, vi } from "vitest";
import { evaluateHostedCases } from "@/server/builder/evaluation/evaluate-hosted-cases";
const makeCase = (inputJson: string, expectedJson: string) => ({ title: "Case", category: "functional" as const, purpose: "Check output", inputJson, expectedJson, expectation: "Exact result" });
describe("hosted case evaluation", () => {
  it("scores exact results and excludes unsupported cases", async () => {
    const invoke = vi.fn().mockResolvedValueOnce("yes").mockResolvedValueOnce("other");
    const result = await evaluateHostedCases([makeCase('{"task":"one"}', '{"result":"yes"}'), makeCase('"two"', '{"result":"yes"}'), makeCase('{}', 'null')], invoke);
    expect(result.cases.map(item => item.status)).toEqual(["passed", "failed", "unsupported"]);
    expect(result.scorePercent).toBe(50);
    expect(invoke).toHaveBeenCalledTimes(2);
  });
  it("does not treat endpoint errors or unknown expected outputs as failures", async () => {
    const result = await evaluateHostedCases([makeCase('"one"', 'null'), makeCase('"two"', '{"result":"ok"}')], async () => { throw new Error("timeout"); });
    expect(result.cases.map(item => item.status)).toEqual(["unsupported", "error"]);
    expect(result.scorePercent).toBeNull();
  });
});
