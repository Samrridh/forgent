import { isDeepStrictEqual } from "node:util";
import { ProposedTestSchema, type ProposedTest } from "./package-review-contract";

export type TestCaseResult = {
  title: string;
  category: ProposedTest["category"];
  status: "passed" | "failed" | "unsupported" | "error";
  detail: string;
  actual?: { result: string };
};
export type EvaluationResult = {
  cases: TestCaseResult[];
  passed: number;
  failed: number;
  unsupported: number;
  errors: number;
  scorePercent: number | null;
};

/** Grade approved cases against the hosted text protocol. This function never executes uploaded code. */
export async function evaluateHostedCases(tests: ProposedTest[], execute: (task: string) => Promise<string>, onProgress?: (result: TestCaseResult, completed: number, total: number) => void): Promise<EvaluationResult> {
  if (tests.length > 20) throw new Error("At most 20 test cases can be evaluated at once.");
  const cases: TestCaseResult[] = [];
  for (const candidate of tests) {
    const test = ProposedTestSchema.parse(candidate);
    const base = { title: test.title, category: test.category };
    const input: unknown = JSON.parse(test.inputJson);
    const expected: unknown = JSON.parse(test.expectedJson);
    const task = typeof input === "string" ? input : typeof input === "object" && input !== null && !Array.isArray(input) && Object.keys(input).length === 1 && "task" in input && typeof input.task === "string" ? input.task : null;
    if (!task?.trim() || task.length > 4000) {
      cases.push({ ...base, status: "unsupported", detail: "The hosted endpoint requires a non-empty text task, either as a JSON string or an object containing only task." });
      onProgress?.(cases[cases.length - 1], cases.length, tests.length);
      continue;
    }
    if (typeof expected !== "object" || expected === null || Array.isArray(expected) || Object.keys(expected).length !== 1 || !("result" in expected) || typeof expected.result !== "string" || !expected.result.trim()) {
      cases.push({ ...base, status: "unsupported", detail: "An exact expected output of the form {\"result\":\"...\"} is required for automated grading." });
      onProgress?.(cases[cases.length - 1], cases.length, tests.length);
      continue;
    }
    try {
      const actual = { result: await execute(task) };
      const passed = isDeepStrictEqual(actual, expected);
      cases.push({ ...base, status: passed ? "passed" : "failed", detail: passed ? "The output exactly matched the approved expected output." : "The output differed from the approved expected output.", actual });
    } catch {
      cases.push({ ...base, status: "error", detail: "The endpoint did not return a usable response; the outcome is unknown." });
    }
    onProgress?.(cases[cases.length - 1], cases.length, tests.length);
  }
  const count = (status: TestCaseResult["status"]) => cases.filter((item) => item.status === status).length;
  const passed = count("passed"); const failed = count("failed");
  return { cases, passed, failed, unsupported: count("unsupported"), errors: count("error"), scorePercent: passed + failed ? Math.round(100 * passed / (passed + failed)) : null };
}
