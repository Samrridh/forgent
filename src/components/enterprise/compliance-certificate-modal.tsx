"use client";

import React, { useState } from "react";
import { ComplianceCertificate } from "@/lib/contracts/compliance-types";
import {
  ShieldCheck,
  X,
  Copy,
  Check,
  Download,
  Calendar,
  Globe,
  Clock,
  Coins,
  FileCode,
  Lock,
} from "lucide-react";

interface ComplianceCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: ComplianceCertificate | null;
}

export function ComplianceCertificateModal({
  isOpen,
  onClose,
  certificate,
}: ComplianceCertificateModalProps) {
  const [copied, setCopied] = useState(false);
  const [showPayload, setShowPayload] = useState(false);

  if (!isOpen || !certificate) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(certificate.sha256Signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(certificate, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `${certificate.certificateNumber.toLowerCase()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cobalt-600/30 border border-cobalt-400/40 text-azure-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-azure-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="cert-modal-title"
                  className="font-serif text-lg font-bold tracking-tight text-white"
                >
                  Enterprise Compliance Certificate
                </h2>
                <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                  {certificate.status}
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400 mt-0.5">
                {certificate.certificateNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-hidden focus:ring-2 focus:ring-azure-400"
            aria-label="Close certificate modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[11px] font-mono text-slate-500 uppercase block">
                Workflow
              </span>
              <span className="font-semibold text-slate-900 truncate block">
                {certificate.workflowName}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-500 uppercase block">
                Organization
              </span>
              <span className="font-semibold text-slate-900 truncate block">
                {certificate.organizationName}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-500 uppercase block">
                Jurisdiction
              </span>
              <div className="flex items-center gap-1 font-semibold text-slate-900">
                <Globe className="w-3.5 h-3.5 text-cobalt-600" />
                <span>{certificate.jurisdiction}</span>
              </div>
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-500 uppercase block">
                Score
              </span>
              <span className="font-mono font-bold text-emerald-600">
                {certificate.complianceScore}/100
              </span>
            </div>
          </div>

          {/* Operational Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600">Measured Latency</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-semibold text-slate-900">
                  {certificate.measuredLatencyMs.toLocaleString()}ms
                </span>
                <span className="font-mono text-[10px] text-slate-400 block">
                  SLA Ceiling: {certificate.latencySlaCeilingMs.toLocaleString()}ms
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Coins className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600">Cost Commitment</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-semibold text-slate-900">
                  ₹{(certificate.committedCostPaise / 100).toLocaleString()}
                </span>
                <span className="font-mono text-[10px] text-slate-400 block">
                  Cap: ₹{(certificate.budgetCapPaise / 100).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Evaluated Rules List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-900 uppercase font-mono tracking-wider">
              Enforced Policy Rules ({certificate.rulesPassed.length}/
              {certificate.rulesEvaluated.length})
            </span>
            <div className="space-y-1.5">
              {certificate.rulesEvaluated.map((ruleName) => {
                const isPassed = certificate.rulesPassed.includes(ruleName);
                return (
                  <div
                    key={ruleName}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                  >
                    <span className="font-medium text-slate-800">{ruleName}</span>
                    <span
                      className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${
                        isPassed
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isPassed ? "PASSED" : "CONDITIONAL"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cryptographic SHA-256 Signature Box */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-200 space-y-2 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-azure-400 font-mono font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>SHA-256 Cryptographic Signature</span>
              </div>
              <button
                type="button"
                onClick={handleCopyHash}
                className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Hash</span>
                  </>
                )}
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-300 break-all p-2 rounded bg-slate-950/80 border border-slate-800">
              {certificate.sha256Signature}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Issued: {new Date(certificate.issuedAt).toUTCString()}
              </span>
              <span>Expires: {new Date(certificate.expiresAt).toISOString().split("T")[0]}</span>
            </div>
          </div>

          {/* Canonical Payload Viewer Toggle */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowPayload(!showPayload)}
              className="flex items-center gap-1.5 text-xs font-semibold text-cobalt-600 hover:text-cobalt-700 transition-colors"
            >
              <FileCode className="w-4 h-4" />
              <span>{showPayload ? "Hide Canonical Payload" : "View Canonical Payload"}</span>
            </button>
            {showPayload && (
              <pre className="p-3 bg-slate-900 text-slate-300 text-[11px] font-mono rounded-lg overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(JSON.parse(certificate.canonicalPayload), null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Authority: {certificate.issuer}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white transition-colors shadow-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
