"use client";

import React, { useState } from "react";
import {
  CandidateWorkflow,
  PolicyEvaluationVerdict,
  ComplianceCertificate,
} from "@/lib/contracts/compliance-types";
import { SAMPLE_CANDIDATE_WORKFLOWS } from "@/server/compliance/compliance-seed";
import { ComplianceCertificateModal } from "./compliance-certificate-modal";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Play,
  RotateCcw,
  Clock,
  Coins,
  Globe,
  Cpu,
  FileCheck2,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";

export function PolicyVerdictCard() {
  const [selectedWorkflowIndex, setSelectedWorkflowIndex] = useState(0);
  const [candidate, setCandidate] = useState<CandidateWorkflow>(
    SAMPLE_CANDIDATE_WORKFLOWS[0]
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [verdict, setVerdict] = useState<PolicyEvaluationVerdict | null>(null);
  const [certificate, setCertificate] = useState<ComplianceCertificate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const handleSelectPreset = (index: number) => {
    setSelectedWorkflowIndex(index);
    setCandidate(SAMPLE_CANDIDATE_WORKFLOWS[index]);
    setVerdict(null);
    setCertificate(null);
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setErrorBanner(null);

    try {
      const response = await fetch("/api/compliance/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate }),
      });

      const data = await response.json();
      if (!data.success) {
        setErrorBanner(data.error || "Evaluation failed");
        return;
      }

      setVerdict(data.verdict);
      setCertificate(data.certificate || null);
    } catch {
      setErrorBanner("Failed to communicate with compliance policy engine");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Candidate Selector */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 font-sans">
              Test Candidate Workflow
            </h3>
            <p className="text-xs text-slate-500">
              Select an enterprise workload profile to evaluate against active SLA and governance policies.
            </p>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {SAMPLE_CANDIDATE_WORKFLOWS.length} Profiles Available
          </span>
        </div>

        {/* Workflow preset pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_CANDIDATE_WORKFLOWS.map((wf, idx) => {
            const isSelected = selectedWorkflowIndex === idx;
            return (
              <button
                key={wf.id}
                type="button"
                onClick={() => handleSelectPreset(idx)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-cobalt-500 bg-cobalt-50/40 ring-1 ring-cobalt-500 shadow-xs"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500 uppercase">
                      Profile {idx + 1}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        idx === 0
                          ? "bg-emerald-500"
                          : idx === 1
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                  </div>
                  <div className="text-xs font-semibold text-slate-900 line-clamp-1">
                    {wf.name}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200/60 mt-2">
                  <span>{wf.estimatedLatencyMs}ms</span>
                  <span>₹{(wf.costPaise / 100).toLocaleString()}</span>
                  <span>{wf.jurisdiction}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Candidate Parameter Summary */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              Execution Latency
            </span>
            <div className="flex items-center gap-1 font-semibold text-slate-800 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{candidate.estimatedLatencyMs.toLocaleString()}ms</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              Budget Commitment
            </span>
            <div className="flex items-center gap-1 font-semibold text-slate-800 mt-0.5">
              <Coins className="w-3.5 h-3.5 text-slate-400" />
              <span>
                ₹{(candidate.costPaise / 100).toLocaleString()} ($
                {(candidate.costPaise / 8000).toFixed(2)})
              </span>
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              Data Sovereignty
            </span>
            <div className="flex items-center gap-1 font-semibold text-slate-800 mt-0.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{candidate.jurisdiction}</span>
            </div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-500 block">
              LLM Provider &amp; Model
            </span>
            <div className="flex items-center gap-1 font-semibold text-slate-800 mt-0.5 truncate">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">
                {candidate.provider} ({candidate.model})
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Evaluates candidate against 5 enterprise SLA and compliance rules.
          </span>
          <button
            type="button"
            disabled={isEvaluating}
            onClick={handleRunEvaluation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Policy Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorBanner && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Verdict & Diagnostics Display */}
      {verdict && (
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-6">
          {/* Header Verdict Ribbon */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                  verdict.verdict === "PASSED"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : verdict.verdict === "CHECKPOINT_REQUIRED"
                    ? "bg-amber-50 border-amber-200 text-amber-600"
                    : "bg-rose-50 border-rose-200 text-rose-600"
                }`}
              >
                {verdict.verdict === "PASSED" ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : verdict.verdict === "CHECKPOINT_REQUIRED" ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-xs font-bold uppercase px-2.5 py-0.5 rounded border ${
                      verdict.verdict === "PASSED"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : verdict.verdict === "CHECKPOINT_REQUIRED"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {verdict.verdict === "PASSED"
                      ? "Passed: Fully Compliant"
                      : verdict.verdict === "CHECKPOINT_REQUIRED"
                      ? "Checkpoint Required: Managerial Approval"
                      : "Violation: Dispatch Blocked"}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    Policy v{verdict.policyVersion}
                  </span>
                </div>
                <p className="text-sm text-slate-700 mt-1">{verdict.summary}</p>
              </div>
            </div>

            {/* Score & Certificate Action */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">
                  Compliance Score
                </span>
                <span
                  className={`font-mono text-2xl font-bold ${
                    verdict.overallScore >= 80
                      ? "text-emerald-600"
                      : verdict.overallScore >= 50
                      ? "text-amber-600"
                      : "text-rose-600"
                  }`}
                >
                  {verdict.overallScore}/100
                </span>
              </div>

              {certificate && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-azure-400" />
                  <span>View Certificate</span>
                </button>
              )}
            </div>
          </div>

          {/* Granular Rule Diagnostics List */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-semibold uppercase text-slate-500 tracking-wider">
              Granular Rule Evaluations ({verdict.diagnostics.length} Active Rules)
            </h4>

            <div className="space-y-2.5">
              {verdict.diagnostics.map((diag) => {
                const isPassed = diag.status === "PASSED";
                const isViolation = diag.status === "VIOLATION";

                return (
                  <div
                    key={diag.ruleId}
                    className={`p-3.5 rounded-lg border text-xs transition-colors ${
                      isPassed
                        ? "bg-slate-50/60 border-slate-200"
                        : isViolation
                        ? "bg-rose-50/40 border-rose-200"
                        : "bg-amber-50/40 border-amber-200"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : isViolation ? (
                          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span className="font-semibold text-slate-900">
                          {diag.ruleName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          [{diag.ruleId}]
                        </span>
                      </div>

                      <span
                        className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded self-start sm:self-auto ${
                          isPassed
                            ? "bg-emerald-100 text-emerald-800"
                            : isViolation
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {diag.status}
                      </span>
                    </div>

                    <p className="text-slate-600 mt-1.5 pl-6">{diag.message}</p>

                    {diag.remediationHint && (
                      <div className="mt-2 pl-6 flex items-start gap-1.5 text-[11px] text-slate-500">
                        <ArrowRight className="w-3 h-3 text-cobalt-600 mt-0.5 shrink-0" />
                        <span>
                          <strong className="text-slate-700">Remediation:</strong>{" "}
                          {diag.remediationHint}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Compliance Certificate Modal */}
      <ComplianceCertificateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        certificate={certificate}
      />
    </div>
  );
}
