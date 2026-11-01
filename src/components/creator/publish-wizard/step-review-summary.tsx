"use client";

import { readApiResponse } from "@/lib/read-api-response";

import { useState } from "react";
import Link from "next/link";
import type { PackageReview } from "@/server/builder/evaluation/package-review-contract";
import type { PublishWizardForm } from "../creator-types";
import { ProposedTestCards } from "@/components/builder/proposed-test-cards";
import { HostedEvaluation } from "./hosted-evaluation";

export function StepReviewSummary({ report, hostedRuntime, formData, onBackToPackage }: { report: PackageReview | null; hostedRuntime: "knowledge-support-v1" | null; formData: PublishWizardForm; onBackToPackage: () => void }) {
  const [listingId, setListingId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [evaluation, setEvaluation] = useState<NonNullable<PackageReview["evaluation"]> | null>(null);
  async function publishDemo() {
    if (!report || !evaluation || evaluation.scorePercent === null || !formData.webhookUrl.trim()) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/marketplace/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formData.name, description: formData.bio, category: formData.category, endpointUrl: formData.webhookUrl, inputSchema: JSON.parse(formData.inputSchema), outputSchema: JSON.parse(formData.outputFormat), pricePaise: Math.round(formData.pricePerTaskUsd * 8000), review: { ...report, evaluation } }) });
      const data = await readApiResponse(response) as { listing?: { id: string }; error?: string };
      if (!response.ok || !data.listing) throw new Error(data.error || "Could not create the demo listing.");
      setListingId(data.listing.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create the demo listing."); }
    finally { setBusy(false); }
  }
  return <section className="min-w-0 space-y-5 break-words">
    <div className="border-b border-border-subtle pb-4"><h3 className="text-base font-bold text-slate-900">Step 5: Review and publish</h3><p className="text-xs text-slate-500 mt-1">Review your proposed tests and publish a demo listing.</p></div>
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2"><h4 className="text-sm font-semibold text-slate-900">Hosted evaluation, not a sandbox</h4><p className="text-sm text-slate-600">The ZIP is inspected, not executed. Approved cases run against your separate test endpoint. Visitors send tasks to your published endpoint. Demo checkout charges no money.</p></div>
    <div><h4 className="text-sm font-semibold text-slate-900">Suggested tests</h4>{report ? <div className="mt-3"><ProposedTestCards tests={report.proposedTests} /></div> : <p className="mt-2 text-sm text-slate-600">Run the static review in step 3 to see suggested tests.</p>}</div>
    {report && <HostedEvaluation key={JSON.stringify(report.proposedTests)} proposed={report.proposedTests} hostedRuntime={hostedRuntime} onChange={setEvaluation} />}
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><p>Run at least one scorable test and provide a public hosted endpoint before publishing. The built-in sample supports testing only. The listing, review, approved cases, and demo results are stored publicly; the ZIP is not saved. No verified badge or overall quality rating is issued.</p>{error && <p role="alert" className="text-red-700 mt-3">{error}</p>}{listingId ? <p className="mt-3">Hackathon listing created. <Link className="text-cobalt-600 underline" href={`/agents/live-${listingId}`}>View it in Explore agents</Link>.</p> : <button type="button" disabled={!evaluation || evaluation.scorePercent === null || !formData.webhookUrl.trim() || busy} onClick={publishDemo} className="mt-3 rounded-lg bg-cobalt-500 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Publishing…" : "Publish hackathon listing"}</button>}<button type="button" onClick={onBackToPackage} className="ml-4 mt-3 text-cobalt-600 font-semibold hover:underline">Return to package review</button></div>
  </section>;
}
