import { describe, expect, it } from "vitest";
import { EvaluationPlanSchema } from "@/server/builder/evaluation/evaluation-plan-contract";
const valid = { version: "1", cases: [{ id: "normal", category: "functional", description: "Process a valid input", input: { amount: 1 }, assertions: [{ kind: "output_schema" }] }] };
describe("evaluation plan contract", () => {
  it("accepts bounded declarative assertions", () => { expect(EvaluationPlanSchema.safeParse(valid).success).toBe(true); });
  it("rejects duplicate IDs and executable assertion types", () => {
    expect(EvaluationPlanSchema.safeParse({ ...valid, cases: [valid.cases[0], valid.cases[0]] }).success).toBe(false);
    expect(EvaluationPlanSchema.safeParse({ ...valid, cases: [{ ...valid.cases[0], assertions: [{ kind: "javascript", code: "return true" }] }] }).success).toBe(false);
  });
});
