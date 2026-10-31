"use client";

import { useEffect, useState } from "react";
import type { ProposedTest } from "@/server/builder/evaluation/package-review-contract";

function formatJson(value: string): string {
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

export function ProposedTestCards({ tests }: { tests: ProposedTest[] }) {
  const [completed, setCompleted] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    if (completed >= tests.length) { setRunning(false); return; }
    const timer = window.setTimeout(() => setCompleted(value => value + 1), 180);
    return () => window.clearTimeout(timer);
  }, [running, completed, tests.length]);
  if (!tests.length) return <p className="text-sm text-slate-600">No tests were suggested for this package.</p>;
  return <div className="space-y-3"><div className="rounded-lg border border-border-default bg-surface-primary p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-sm">Simulated evaluation</strong><p className="mt-1 text-xs text-slate-600">Preview the proposed tests. No agent, test, or model is run.</p></div><button type="button" className="business-primary" disabled={running} onClick={() => { setCompleted(0); setRunning(true); }}>{running ? "Simulating…" : completed ? "Replay simulation" : "Simulate evaluation"}</button></div>{(running || completed > 0) && <div className="mt-4" role="status" aria-live="polite"><div className="flex justify-between gap-2 text-xs text-slate-600"><span>{running ? "Simulating proposed tests" : "Simulation complete"}</span><span>{completed} / {tests.length}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-cobalt-500 transition-all" style={{ width: `${completed / tests.length * 100}%` }} /></div><p className="mt-2 text-xs text-slate-600">Illustrative progress only. No pass or fail result has been measured.</p></div>}</div>{tests.map((test, index) => <details key={index} className="group min-w-0 rounded-lg border border-border-default bg-surface-primary">
    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt-500">
      <span className="min-w-0"><span className="block text-xs font-mono uppercase text-cobalt-700">{String(index + 1).padStart(2, "0")} / {test.category.replaceAll("_", " ")}</span><span className="mt-1 block break-words text-sm font-semibold text-slate-900">{test.title}</span></span>
      <span className="rounded border border-border-default px-2 py-1 text-xs text-slate-600">{index < completed ? "Simulated" : running && index === completed ? "Simulating" : "Not run"}</span>
    </summary>
    <div className="min-w-0 space-y-4 border-t border-border-subtle p-4 text-sm text-slate-700">
      <p className="break-words">{test.purpose}</p>
      <div className="grid min-w-0 gap-3 md:grid-cols-2"><div className="min-w-0"><h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Example input</h5><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md bg-slate-100 p-3 text-xs">{formatJson(test.inputJson)}</pre></div><div className="min-w-0"><h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Expected output</h5><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md bg-slate-100 p-3 text-xs">{formatJson(test.expectedJson)}</pre></div></div>
      <div><h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Expected behavior</h5><p className="break-words">{test.expectation}</p></div>
    </div>
  </details>)}</div>;
}
