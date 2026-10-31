"use client";

import type { PackageReview } from "@/server/builder/evaluation/package-review-contract";
import { ProposedTestCards } from "@/components/builder/proposed-test-cards";

export function StepReviewSummary({ report, onBackToPackage }: { report: PackageReview | null; onBackToPackage: () => void }) {
  return <section className="min-w-0 space-y-5 break-words">
    <div className="border-b border-border-subtle pb-4"><h3 className="text-base font-bold text-slate-900">Step 5: Review and next steps</h3><p className="text-xs text-slate-500 mt-1">Check the suggested tests and review what remains before publication.</p></div>
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2"><h4 className="text-sm font-semibold text-slate-900">Runtime tests have not run</h4><p className="text-sm text-slate-600">Gemini suggests tests from its static review. These are proposed cases, not executed tests or measured results. The uploaded code was not run, and security, reliability, and performance are unverified.</p></div>
    <div><h4 className="text-sm font-semibold text-slate-900">Suggested tests</h4>{report ? report.proposedTests.length ? <div className="mt-3"><ProposedTestCards tests={report.proposedTests} /></div> : <p className="mt-2 text-sm text-slate-600">The review did not suggest any tests.</p> : <p className="mt-2 text-sm text-slate-600">Run the static review in step 3 to see suggested tests.</p>}</div>
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600"><p>Publishing is not available in this demo. The ZIP and review are not stored, and no verified badge or rating is issued.</p><button type="button" onClick={onBackToPackage} className="mt-3 text-cobalt-600 font-semibold hover:underline">Return to package review</button></div>
  </section>;
}
