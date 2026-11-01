"use client";

import { readApiResponse } from "@/lib/read-api-response";

import { useState } from "react";
import { HostedEvaluation } from "@/components/creator/publish-wizard/hosted-evaluation";
import type { BusinessRequest, CompilerOutput } from "@/server/compiler/business-compiler-contracts";
import type { ProposedTest } from "@/server/builder/evaluation/package-review-contract";
import { WorkflowPlayground } from "./workflow-playground";
import { HOSTED_SAMPLE_AGENT_ID, HOSTED_SAMPLE_CASES } from "@/lib/contracts/hosted-sample-fixtures";
import { ProposedTestCards } from "@/components/builder/proposed-test-cards";

export function CandidateEvaluation({ requirements, candidate }: { requirements: BusinessRequest; candidate: CompilerOutput["candidates"][number] }) {
  const [tests, setTests] = useState<ProposedTest[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [workflowPath, setWorkflowPath] = useState<string | null>(null);
  const runnable = candidate.agentIds.every((id) => id.startsWith("listing:") || id === HOSTED_SAMPLE_AGENT_ID);
  const isSample = candidate.agentIds.length === 1 && candidate.agentIds[0] === HOSTED_SAMPLE_AGENT_ID;
  async function generate() {
    setLoading(true); setError(""); setTests(null); setWorkflowPath(null);
    try {
      const response = await fetch("/api/business/test-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requirements, candidate: { title: candidate.title, rationale: candidate.rationale, agentIds: candidate.agentIds } }) });
      const data = await readApiResponse(response) as { tests?: ProposedTest[]; error?: string };
      if (!response.ok || !data.tests?.length) throw new Error(data.error || "Could not generate a test plan.");
      setTests(data.tests);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not generate a test plan."); }
    finally { setLoading(false); }
  }
  return <section className="space-y-4">
    <p>Generate synthetic cases from your job and the agents’ declared capabilities. Review the expected answers, then run supported agents in sequence.</p>
    <p>{runnable ? "The platform runs its support demo or uses published agents’ registered endpoints. Requests to published agents may trigger actions or costs. Use synthetic data. Demo reports and endpoints are temporary." : "This candidate cannot run yet: every stage needs a supported platform runtime or a published marketplace endpoint. You can still review a proposed test plan."}</p>
    <p>If an expected answer is shown as <code>null</code>, edit it before running to make that case scorable.</p>
    <button type="button" className="business-primary" disabled={loading} onClick={() => void generate()}>{loading ? "Preparing test plan…" : tests ? "Generate a new test plan" : "Generate test plan"}</button>
    {isSample && <button type="button" className="ml-4 text-sm font-semibold text-cobalt-600 underline" disabled={loading} onClick={() => { setError(""); setWorkflowPath(null); setTests(HOSTED_SAMPLE_CASES); }}>Use demo test cases</button>}
    {error && <p role="alert">{error}</p>}
    {tests && runnable && <HostedEvaluation key={JSON.stringify(tests)} proposed={tests} hostedRuntime={null} context="business" businessAgentIds={candidate.agentIds} onChange={() => {}} onWorkflowReady={setWorkflowPath} />}
    {tests && !runnable && <ProposedTestCards tests={tests} />}
    {workflowPath && <div aria-live="polite"><p className="font-semibold">All approved cases passed. Your temporary workflow endpoint is ready below.</p><WorkflowPlayground unlocked workflowPath={workflowPath} /></div>}
  </section>;
}
