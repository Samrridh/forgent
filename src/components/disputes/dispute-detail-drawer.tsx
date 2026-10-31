"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCurrency } from "@/context/currency-context";
import {
  Scale,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Fingerprint,
} from "lucide-react";
import { DisputeRecord } from "@/server/arbitration/oracle-arbiter";

interface DisputeDetailDrawerProps {
  dispute: DisputeRecord;
  onClose: () => void;
  onDisputeUpdated: (updated: DisputeRecord) => void;
}

export function DisputeDetailDrawer({
  dispute,
  onClose,
  onDisputeUpdated,
}: DisputeDetailDrawerProps) {
  const { currency } = useCurrency();
  const [activeTab, setActiveTab] = useState<"DIFF" | "CRITERIA" | "INTEGRITY">("DIFF");
  const [arbitrating, setArbitrating] = useState(false);
  const [arbitrationError, setArbitrationError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [evaluationPrompt, setEvaluationPrompt] = useState("");

  const formatAmount = (cents: number, paise: number) => {
    if (currency === "INR") {
      return `₹${(paise / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${(cents / 100).toFixed(2)}`;
  };

  const isResolved = dispute.status === "RESOLVED";
  const resolution = dispute.resolution;

  async function handleTriggerArbitration() {
    setArbitrating(true);
    setArbitrationError(null);

    try {
      const res = await fetch(`/api/disputes/${dispute.id}/arbitrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluationPrompt: evaluationPrompt.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute arbitration");
      }

      onDisputeUpdated(data.dispute);
    } catch (err) {
      setArbitrationError(err instanceof Error ? err.message : "Arbitration failed");
    } finally {
      setArbitrating(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-porcelain-100 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cobalt-500/10 text-cobalt-600 flex items-center justify-center border border-cobalt-200">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-slate-900">
                  {dispute.title}
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    isResolved
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {dispute.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-500 mt-0.5">
                <span>Dispute: {dispute.id}</span>
                <span>•</span>
                <span>Work Order: {dispute.jobId}</span>
                <span>•</span>
                <span className="text-cobalt-600 font-semibold">{dispute.agentSlug}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                Claimed Escrow Amount
              </span>
              <div className="font-mono text-lg font-bold text-slate-900 mt-1">
                {formatAmount(dispute.claimAmountCents, dispute.claimAmountPaise)}
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                Dispute Category
              </span>
              <div className="font-mono text-xs font-semibold text-slate-800 mt-1 truncate">
                {dispute.category.replace(/_/g, " ")}
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                Parties Involved
              </span>
              <div className="font-mono text-xs text-slate-700 mt-1 truncate">
                <span className="font-semibold text-slate-900">{dispute.complainantId}</span> vs{" "}
                <span className="text-slate-600">{dispute.respondentId}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-1.5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Dispute Statement of Fact
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {dispute.description}
            </p>
          </div>

          {/* Evidence Diff Tabs */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-porcelain-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-mono font-semibold text-slate-800 uppercase tracking-wider">
                  Contractual Evidence Audit
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("DIFF")}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    activeTab === "DIFF"
                      ? "bg-white text-cobalt-600 font-bold shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Contract vs Deliverable Diff
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("CRITERIA")}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    activeTab === "CRITERIA"
                      ? "bg-white text-cobalt-600 font-bold shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Acceptance Criteria
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("INTEGRITY")}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    activeTab === "INTEGRITY"
                      ? "bg-white text-cobalt-600 font-bold shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  SHA-256 Digest
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50">
              {activeTab === "DIFF" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                        Declared Contract Input
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Baseline Spec</span>
                    </div>
                    <pre className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 overflow-x-auto max-h-56">
                      {JSON.stringify(dispute.evidence.declaredInput, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                        Actual Deliverable Output
                      </span>
                      <span className="text-[10px] font-mono text-cobalt-600 font-semibold">
                        Contested Deliverable
                      </span>
                    </div>
                    <pre className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 overflow-x-auto max-h-56">
                      {JSON.stringify(dispute.evidence.actualDeliverable, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {activeTab === "CRITERIA" && (
                <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="font-mono text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    Expected Contractual Invariants
                  </div>
                  <p className="text-slate-700 leading-relaxed font-sans">
                    {dispute.evidence.expectedCriteriaSummary ||
                      "Autonomous agent must satisfy strict schema conformity and 0.00% numerical float drift across reconciliation records."}
                  </p>
                </div>
              )}

              {activeTab === "INTEGRITY" && (
                <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-cobalt-600" />
                      <span className="text-xs font-mono font-semibold text-slate-800">
                        Cryptographic Hash Provenance
                      </span>
                    </div>
                    <div
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold ${
                        dispute.evidence.hashIntegrityMatched
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {dispute.evidence.hashIntegrityMatched ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>SHA-256 Provenance Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          <span>Digest Mismatch Detected</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="text-slate-500">Provided Digest:</div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 break-all select-all">
                      {dispute.evidence.providedIntegrityHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                    </div>
                    <div className="text-slate-500 pt-1">Canonical Computed Digest:</div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 break-all select-all">
                      {dispute.evidence.canonicalIntegrityHash || dispute.evidence.providedIntegrityHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Oracle Arbiter Verdict or Action */}
          {isResolved && resolution ? (
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm space-y-0">
              <div className="bg-porcelain-100 border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cobalt-600" />
                  <span className="font-serif font-bold text-sm text-slate-900">
                    Oracle Arbitration Verdict & Settlement
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Model:</span>
                  <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {resolution.arbiterModel}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Verdict Headline Banner */}
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    resolution.verdict === "REFUND_BUYER"
                      ? "bg-rose-50/60 border-rose-200"
                      : resolution.verdict === "RELEASE_CREATOR"
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-amber-50/60 border-amber-200"
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      Binding Decision
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-xl font-bold text-slate-900">
                        {resolution.verdict.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      Buyer Refund Ratio
                    </span>
                    <div className="font-mono text-xl font-bold text-slate-900">
                      {resolution.refundPercentage}%
                    </div>
                  </div>
                </div>

                {/* Economic Settlement Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Buyer Refund</span>
                      <span>{resolution.refundPercentage}%</span>
                    </div>
                    <div className="font-mono text-base font-bold text-emerald-700 mt-1">
                      {formatAmount(resolution.buyerRefundCents, resolution.buyerRefundPaise)}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Creator Compensation</span>
                      <span>85% Net</span>
                    </div>
                    <div className="font-mono text-base font-bold text-slate-900 mt-1">
                      {formatAmount(resolution.creatorPayoutCents, resolution.creatorPayoutPaise)}
                    </div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Platform Protocol Fee</span>
                      <span>15% Net</span>
                    </div>
                    <div className="font-mono text-base font-bold text-slate-700 mt-1">
                      {formatAmount(resolution.platformFeeCents, resolution.platformFeePaise)}
                    </div>
                  </div>
                </div>

                {/* Arbiter Reasoning */}
                <div className="p-4 bg-porcelain-100/80 border border-slate-200 rounded-lg space-y-1">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
                    Oracle Reasoning
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-sans">
                    {resolution.reasoning}
                  </p>
                </div>

                {/* Cryptographic Receipt */}
                <div className="p-4 bg-slate-900 text-slate-100 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fingerprint className="w-4 h-4 text-azure-400" />
                      <span className="text-xs font-mono font-semibold tracking-wide text-slate-200">
                        Cryptographic Dispute Resolution Receipt
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(resolution.arbitratedAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Receipt ID: {resolution.receiptId}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(resolution.integrityDigest)}
                        className="inline-flex items-center gap-1 text-azure-400 hover:text-azure-300 transition-colors"
                      >
                        {copiedHash ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy SHA-256</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-2 bg-slate-800/80 rounded border border-slate-700 font-mono text-[11px] text-slate-300 break-all select-all">
                      {resolution.integrityDigest}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Atomic settlement confirmed in escrow ledger</span>
                    <Link
                      href="/verify"
                      className="inline-flex items-center gap-1 text-azure-400 hover:underline"
                    >
                      <span>Verify on Public Inspector</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Neutral Multi-Agent Oracle Adjudication
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Execute automated arbitration to assess contract compliance and settle the locked escrow.
                  </p>
                </div>
              </div>

              {arbitrationError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{arbitrationError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1.5">
                  Custom Arbiter Directives (Optional)
                </label>
                <input
                  type="text"
                  value={evaluationPrompt}
                  onChange={(e) => setEvaluationPrompt(e.target.value)}
                  placeholder="e.g. Prioritize line-item inventory physical counts against invoice totals"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cobalt-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500">
                  Escrow Lock Status: <span className="font-semibold text-slate-800">LOCKED IN HOLD</span>
                </span>
                <button
                  type="button"
                  onClick={handleTriggerArbitration}
                  disabled={arbitrating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-mono font-semibold transition-colors disabled:opacity-50"
                >
                  {arbitrating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Arbitrating Contract...</span>
                    </>
                  ) : (
                    <>
                      <Scale className="w-3.5 h-3.5" />
                      <span>Execute Oracle Arbitration</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
