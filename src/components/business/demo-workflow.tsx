"use client";

import { CandidateGraph } from "./candidate-graph";
import { HostedEvaluation } from "@/components/creator/publish-wizard/hosted-evaluation";
import { HOSTED_SAMPLE_CASES } from "@/lib/contracts/hosted-sample-fixtures";

export function DemoWorkflow({ onPass, passed, onTry }: { onPass: (passed: boolean) => void; passed: boolean; onTry: () => void }) {
  return <section className="business-panel"><p className="business-kicker">WORKFLOW / DEMO</p><h2>Support knowledge workflow</h2><p>Answers common team support questions using a fixed set of sample articles and hands unfamiliar questions to a person. This is a platform-provided demo workflow.</p>
    <CandidateGraph stages={[{ id: "support", label: "Support knowledge assistant", dependsOn: [] }]} />
    <div className="mt-8"><h3>Evaluate the workflow</h3><p>Review the sample cases and approve them to run the workflow. The sample cases are deterministic; they do not test other recommended agents.</p>
      <HostedEvaluation proposed={HOSTED_SAMPLE_CASES} hostedRuntime="knowledge-support-v1" context="business" onChange={(report) => onPass(Boolean(report && report.executionMode === "platform_sample" && JSON.stringify(report.approvedCases) === JSON.stringify(HOSTED_SAMPLE_CASES) && report.passed === HOSTED_SAMPLE_CASES.length && report.failed === 0 && report.unsupported === 0 && report.errors === 0))} />
      {passed && <div role="status"><p>All demo cases passed. The sample endpoint is ready to try.</p><button type="button" className="business-primary" onClick={onTry}>Open workflow endpoint</button></div>}
    </div>
  </section>;
}
