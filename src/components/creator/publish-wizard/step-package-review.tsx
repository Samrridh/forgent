"use client";

import { useState } from "react";
import type { PublishWizardForm } from "../creator-types";
import type { PackageReview } from "@/server/builder/evaluation/package-review-contract";
import { ProposedTestCards } from "@/components/builder/proposed-test-cards";

export type ReviewResult = { report: PackageReview; filesReviewed: string[] };

export function StepPackageReview({ formData, onReviewChange }: { formData: PublishWizardForm; onReviewChange: (result: ReviewResult | null) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function runReview() {
    if (!file) { setError("Choose a ZIP package first."); return; }
    const data = new FormData();
    data.set("name", formData.name); data.set("description", formData.bio);
    data.set("inputSchema", formData.inputSchema); data.set("outputSchema", formData.outputFormat);
    data.set("package", file);
    setLoading(true); setError(""); setReview(null); onReviewChange(null);
    try {
      const response = await fetch("/api/builder/package-review", { method: "POST", body: data });
      const result = await response.json() as ReviewResult & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not review the package.");
      setReview(result); onReviewChange(result);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not review the package."); }
    finally { setLoading(false); }
  }

  return <section className="min-w-0 space-y-5 break-words">
    <div><h2 className="text-xl font-semibold text-slate-900">Upload your agent package</h2><p className="mt-2 text-sm text-slate-600">Choose a Node.js source ZIP and review it against the name, description, and schemas from the earlier steps. Static review does not execute the code.</p></div>
    <label className="block text-sm font-semibold text-slate-800">Agent source ZIP
      <input className="mt-2 block w-full text-sm font-normal" type="file" accept=".zip,application/zip" onChange={(event) => { setFile(event.target.files?.[0] || null); setReview(null); onReviewChange(null); setError(""); }} />
    </label>
    <p className="text-xs text-slate-600">Source and documentation only. Maximum 1 MB compressed and 200 KB uncompressed. The source and schemas are sent to Gemini; remove secrets and private data first. This demo does not store or publish the ZIP.</p>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {loading && <div role="status" className="rounded-lg border border-border-default bg-slate-50 p-4 text-sm text-slate-700"><p className="font-semibold">Static review in progress</p><p>Checking the package and asking Gemini to review the source. This is a simulation; no sandbox is created and no code is run.</p></div>}
    <button type="button" onClick={runReview} disabled={loading} className="px-4 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold disabled:opacity-60">{loading ? "Reviewing package…" : "Run static review"}</button>
    {review && <div className="space-y-4 border-t border-border-subtle pt-5"><h3 className="text-lg font-semibold">Static review</h3><p className="text-sm text-slate-600">No code was executed. Findings are AI-generated and require review; this is not a runtime or security test.</p><p className="text-sm">{review.report.summary}</p><p className="text-xs text-slate-600">Files reviewed: {review.filesReviewed.join(", ")}</p>{review.report.findings.map((item, index) => <article className="border-t border-border-subtle pt-3" key={index}><p className="text-xs uppercase font-semibold text-cobalt-700">{item.category} · {item.severity}</p><h4 className="font-semibold mt-1">{item.summary}</h4><p className="text-sm mt-1">Evidence: {item.evidence}</p><p className="text-sm mt-1">Suggested action: {item.recommendation}</p></article>)}<h4 className="font-semibold">Proposed tests</h4><p className="text-sm text-slate-600">These are suggestions, not tests that have run. Review them in the final step.</p><ProposedTestCards tests={review.report.proposedTests} /><h4 className="font-semibold">Limitations</h4><ul className="list-disc pl-5 text-sm space-y-1">{review.report.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}
  </section>;
}
