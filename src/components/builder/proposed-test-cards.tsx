import type { ProposedTest } from "@/server/builder/evaluation/package-review-contract";

function formatJson(value: string): string {
  try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; }
}

export function ProposedTestCards({ tests }: { tests: ProposedTest[] }) {
  if (!tests.length) return <p className="text-sm text-slate-600">No tests were suggested for this package.</p>;
  return <div className="space-y-3">{tests.map((test, index) => <details key={index} className="group min-w-0 rounded-lg border border-border-default bg-surface-primary">
    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt-500">
      <span className="min-w-0"><span className="block text-xs font-mono uppercase text-cobalt-700">{String(index + 1).padStart(2, "0")} / {test.category.replaceAll("_", " ")}</span><span className="mt-1 block break-words text-sm font-semibold text-slate-900">{test.title}</span></span>
      <span className="rounded border border-border-default px-2 py-1 text-xs text-slate-600">Not run</span>
    </summary>
    <div className="min-w-0 space-y-4 border-t border-border-subtle p-4 text-sm text-slate-700">
      <p className="break-words">{test.purpose}</p>
      <div className="grid min-w-0 gap-3 md:grid-cols-2"><div className="min-w-0"><h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Example input</h5><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md bg-slate-100 p-3 text-xs">{formatJson(test.inputJson)}</pre></div><div className="min-w-0"><h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Expected output</h5><pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all rounded-md bg-slate-100 p-3 text-xs">{formatJson(test.expectedJson)}</pre></div></div>
      <div><h5 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Expected behavior</h5><p className="break-words">{test.expectation}</p></div>
    </div>
  </details>)}</div>;
}
