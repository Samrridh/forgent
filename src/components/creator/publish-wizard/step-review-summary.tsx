"use client";

import { useState } from "react";
import Link from "next/link";
import type { PackageReview } from "@/server/builder/evaluation/package-review-contract";
import type { PublishWizardForm } from "../creator-types";
import { ProposedTestCards } from "@/components/builder/proposed-test-cards";

export function StepReviewSummary({ report, formData, onBackToPackage }: { report: PackageReview | null; formData: PublishWizardForm; onBackToPackage: () => void }) {
  const [listingId, setListingId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function publishDemo() {
    if (!report) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/marketplace/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: formData.name, description: formData.bio, category: formData.category, endpointUrl: formData.webhookUrl, inputSchema: JSON.parse(formData.inputSchema), outputSchema: JSON.parse(formData.outputFormat), pricePaise: Math.round(formData.pricePerTaskUsd * 8000), review: report }) });
      const data = await response.json() as { listing?: { id: string }; error?: string };
      if (!response.ok || !data.listing) throw new Error(data.error || "Could not create the demo listing.");
      setListingId(data.listing.id);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create the demo listing."); }
    finally { setBusy(false); }
  }
  return <section className="min-w-0 space-y-5 break-words">
    <div className="border-b border-border-subtle pb-4"><h3 className="text-base font-bold text-slate-900">Step 5: Review and publish</h3><p className="text-xs text-slate-500 mt-1">Review your proposed tests and publish a demo listing.</p></div>
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2"><h4 className="text-sm font-semibold text-slate-900">Static review, not a sandbox</h4><p className="text-sm text-slate-600">Your ZIP was inspected, not executed. The suggested tests have not run. Visitors will send tasks to your hosted endpoint. Checkout uses a demo bypass; no money is charged.</p></div>
    <div><h4 className="text-sm font-semibold text-slate-900">Suggested tests</h4>{report ? <div className="mt-3"><ProposedTestCards tests={report.proposedTests} /></div> : <p className="mt-2 text-sm text-slate-600">Run the static review in step 3 to see suggested tests.</p>}</div>
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><p>The listing and review are stored in the configured database. The ZIP is not saved, and no verified badge or rating is issued.</p>{error && <p role="alert" className="text-red-700 mt-3">{error}</p>}{listingId ? <p className="mt-3">Hackathon listing created. <Link className="text-cobalt-600 underline" href={`/agents/live-${listingId}`}>View it in Explore agents</Link>.</p> : <button type="button" disabled={!report || busy} onClick={publishDemo} className="mt-3 rounded-lg bg-cobalt-500 px-4 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Publishing…" : "Publish hackathon listing"}</button>}<button type="button" onClick={onBackToPackage} className="ml-4 mt-3 text-cobalt-600 font-semibold hover:underline">Return to package review</button></div>
  </section>;
}
