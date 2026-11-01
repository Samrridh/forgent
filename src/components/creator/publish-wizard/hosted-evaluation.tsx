"use client";

import { readApiResponse } from "@/lib/read-api-response";

import { useState } from "react";
import { HOSTED_SAMPLE_CASES } from "@/lib/contracts/hosted-sample-fixtures";
import type { ProposedTest } from "@/server/builder/evaluation/package-review-contract";
import type { EvaluationResult } from "@/server/builder/evaluation/evaluate-hosted-cases";

type Evaluation = EvaluationResult & { evaluatedAt: string; executionMode: "hosted_endpoint" | "platform_sample" | "business_workflow"; workflowPath?: string };
type Summary = { evaluatedAt: string; executionMode: "hosted_endpoint" | "platform_sample"; passed: number; failed: number; unsupported: number; errors: number; scorePercent: number | null; approvedCases: ProposedTest[]; cases: { title: string; status: "passed" | "failed" | "unsupported" | "error"; detail: string }[] };

export function HostedEvaluation({ proposed, hostedRuntime, onChange, context = "builder", businessAgentIds, onWorkflowReady }: { proposed: ProposedTest[]; hostedRuntime: "knowledge-support-v1" | null; onChange: (summary: Summary | null) => void; context?: "builder" | "business"; businessAgentIds?: string[]; onWorkflowReady?: (path: string | null) => void }) {
  const [cases, setCases] = useState(hostedRuntime ? HOSTED_SAMPLE_CASES : proposed.slice(0, 5));
  const [endpointUrl, setEndpoint] = useState("");
  const [approved, setApproved] = useState(false);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number; title: string; status: string } | null>(null);
  function clearResult() { setResult(null); onChange(null); onWorkflowReady?.(null); setApproved(false); }
  function update(index: number, field: "inputJson" | "expectedJson", value: string) {
    setCases((previous) => previous.map((item, i) => i === index ? { ...item, [field]: value } : item));
    clearResult();
  }
  async function run() {
    setRunning(true); setError(""); setResult(null); setProgress(null); onChange(null); onWorkflowReady?.(null);
    try {
      const response = await fetch("/api/builder/evaluate-hosted", { method: "POST", headers: { "Content-Type": "application/json", "Accept": "text/event-stream" }, body: JSON.stringify({ endpointUrl, hostedRuntime, approved, cases, ...(businessAgentIds ? { agentIds: businessAgentIds } : {}) }) });
      if (!response.ok) { const data = await readApiResponse(response) as { error?: string }; throw new Error(data.error || "Evaluation failed."); }
      if (!response.body) throw new Error("The evaluation stream is unavailable.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let evaluation: Evaluation | null = null;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary = buffer.indexOf("\n\n");
        while (boundary !== -1) {
          const frame = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
          const line = frame.split("\n").find((part) => part.startsWith("data: "));
          if (line) {
            const event = JSON.parse(line.slice(6)) as { type: string; completed?: number; total?: number; result?: { title: string; status: string }; evaluation?: Evaluation; error?: string };
            if (event.type === "progress" && event.result && event.completed !== undefined && event.total !== undefined) setProgress({ completed: event.completed, total: event.total, ...event.result });
            if (event.type === "complete" && event.evaluation) evaluation = event.evaluation;
            if (event.type === "error") throw new Error(event.error || "Evaluation failed.");
          }
          boundary = buffer.indexOf("\n\n");
        }
      }
      if (!evaluation) throw new Error("The evaluation connection ended before the report was received.");
      setResult(evaluation);
      const { evaluatedAt, executionMode, passed, failed, unsupported, errors, scorePercent } = evaluation;
      if (executionMode !== "business_workflow") onChange({ evaluatedAt, executionMode, passed, failed, unsupported, errors, scorePercent, approvedCases: cases, cases: evaluation.cases.map(({ title, status, detail }) => ({ title, status, detail })) });
      if (evaluation.workflowPath) onWorkflowReady?.(evaluation.workflowPath);
    } catch (err) { setError(err instanceof Error ? err.message : "Evaluation failed."); }
    finally { setRunning(false); }
  }
  if (!cases.length) return <p className="text-sm text-slate-600">The review did not suggest tests to run.</p>;
  return <section className="space-y-4"><div><h4 className="text-sm font-semibold">Review and run test cases</h4><p className="mt-1 text-sm text-slate-600">{hostedRuntime ? (context === "business" ? "The original sample cases must all pass to unlock the demo endpoint. " : "These platform-provided cases match the built-in sample; Gemini’s suggestions are shown above. ") : ""}Edit the {cases.length} cases. Input must be a JSON string or {`{"task":"..."}`}; expected output must be {`{"result":"..."}`}. Comparisons are exact.</p></div>
    <fieldset disabled={running} className="space-y-4">{hostedRuntime && <div className="flex flex-wrap gap-3 text-sm"><button type="button" className="text-cobalt-600 underline" onClick={() => { setCases(HOSTED_SAMPLE_CASES); clearResult(); }}>Use sample cases</button>{context !== "business" && <button type="button" className="text-cobalt-600 underline" onClick={() => { setCases(proposed.slice(0, 5)); clearResult(); }}>Use Gemini suggestions</button>}</div>}{!businessAgentIds && !(context === "business" && hostedRuntime) && <label className="block text-sm font-semibold">{context === "business" ? "Workflow test endpoint you control" : "Builder-controlled test endpoint"}<input className="form-input mt-2" type="url" value={endpointUrl} onChange={(event) => { setEndpoint(event.target.value); clearResult(); }} placeholder="https://test-agent.example/run" /></label>}<p className="text-xs text-slate-600">{businessAgentIds ? "Cases run through the selected agents in order. Each result becomes the next agent’s text task. Published agents may cause actions or costs; use synthetic data." : context === "business" && hostedRuntime ? "These cases run against the platform-provided support demo and its fixed sample articles." : context === "business" ? "Use a test-only HTTPS endpoint for the complete candidate workflow. Requests can trigger actions or costs. Use synthetic data. This does not deploy or verify the suggested agents." : hostedRuntime ? "When the test endpoint is empty, cases run against the platform-owned support sample with demo articles. This does not execute uploaded code. If an endpoint is provided, real requests may trigger actions or costs. Approved cases are saved with the public listing." : "Tests make real requests to this endpoint and could trigger actions or costs. Use a test-only environment and synthetic data; the uploaded ZIP is not executed. Approved cases are saved with the public listing."}</p>
      {cases.map((item, index) => <details key={index} className="rounded-lg border border-border-default bg-surface-primary"><summary className="cursor-pointer p-4 text-sm font-semibold">{index + 1}. {item.title}</summary><div className="space-y-3 border-t border-border-subtle p-4"><p className="text-sm text-slate-600">{item.purpose}</p><label className="block text-xs font-semibold">Input JSON<textarea className="form-input mt-2 min-h-24 font-mono" value={item.inputJson} onChange={(event) => update(index, "inputJson", event.target.value)} /></label><label className="block text-xs font-semibold">Expected output JSON<textarea className="form-input mt-2 min-h-24 font-mono" value={item.expectedJson} onChange={(event) => update(index, "expectedJson", event.target.value)} /></label><p className="text-xs text-slate-600">Suggested check: {item.expectation}</p></div></details>)}
      <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /><span>{businessAgentIds ? "I approve these inputs and expected outputs and understand that running the published agents may cause actions or costs." : endpointUrl.trim() ? "I control this test endpoint and approve these inputs and expected outputs. I understand the requests can trigger actions or costs." : "I approve these inputs and expected outputs for the built-in support sample."}</span></label>
      <button type="button" disabled={!approved || (!endpointUrl.trim() && !hostedRuntime && !businessAgentIds)} onClick={() => void run()} className="rounded-lg bg-cobalt-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{running ? "Evaluating…" : "Run approved tests"}</button>
    </fieldset>{running && <p role="status" aria-live="polite" className="text-sm text-slate-600">{progress ? `${progress.completed} of ${progress.total} cases checked · ${progress.title}: ${progress.status}` : "Starting evaluation. Cases run one at a time; each request can take up to 15 seconds."}</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {result && <div className="space-y-3 rounded-lg border border-border-default bg-slate-50 p-4" role="status"><h4 className="font-semibold">Evaluation report</h4><p className="text-sm">{result.scorePercent === null ? "No scored cases" : `${result.scorePercent}% exact matches`} · {result.passed} passed · {result.failed} failed · {result.unsupported} unsupported · {result.errors} errors</p><p className="text-xs text-slate-600">The score covers only completed exact-match cases; it is not a security or overall quality rating. {businessAgentIds ? "Results cover the submitted cases against the selected workflow. Passing does not establish security or suitability for other inputs." : context === "business" && hostedRuntime ? "These results apply to the platform-provided demo workflow. This report lasts only while this page is open." : context === "business" ? "Results apply only to the endpoint you supplied; its connection to this candidate is not verified. This report lasts only while this page is open." : "Test results are builder-supplied demo data, not independently verified."}</p>{result.cases.map((item, index) => <article key={index} className="border-t border-border-subtle pt-3 text-sm"><strong>{item.title} · {item.status}</strong><p>{item.detail}</p>{item.actual && <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded bg-white p-2 text-xs">{JSON.stringify(item.actual, null, 2)}</pre>}</article>)}</div>}
  </section>;
}
