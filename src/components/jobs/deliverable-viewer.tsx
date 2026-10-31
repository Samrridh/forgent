"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EvidenceReceipt } from "@/server/engine/receipt";
import {
  FileText,
  FileJson,
  ShieldCheck,
  Copy,
  Check,
  Download,
  Share2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";

interface DeliverableData {
  summaryMarkdown: string;
  structuredJson: Record<string, unknown>;
  sha256Receipt: string;
  modelUsed: string;
  tokensUsed: number;
  latencyMs: number;
}

interface DeliverableViewerProps {
  jobId: string;
  agentSlug: string;
  deliverable: DeliverableData;
  receipt?: EvidenceReceipt;
}

export function DeliverableViewer({
  jobId,
  agentSlug,
  deliverable,
  receipt,
}: DeliverableViewerProps) {
  const [activeTab, setActiveTab] = useState<"markdown" | "json" | "receipt">("markdown");
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const integrityHash = receipt?.integrityHash || deliverable.sha256Receipt;
  const verificationUrl = typeof window !== "undefined"
    ? `${window.location.origin}/verify?jobId=${jobId}&hash=${integrityHash}`
    : `/verify?jobId=${jobId}&hash=${integrityHash}`;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(integrityHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(deliverable.structuredJson, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([deliverable.summaryMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `deliverable_${jobId}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob(
      [JSON.stringify(deliverable.structuredJson, null, 2)],
      { type: "application/json;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `deliverable_${jobId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden space-y-0">
      {/* Viewer Header & Actions Bar */}
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verified Deliverable</span>
            </span>
            <span className="text-xs font-mono text-slate-500">
              Completed in {deliverable.latencyMs}ms ({deliverable.tokensUsed} tokens)
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            Autonomous Work Order Deliverable
          </h2>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono font-medium transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>.md</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono font-medium transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>.json</span>
          </button>

          <button
            type="button"
            onClick={handleCopyShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cobalt-200 bg-cobalt-50 hover:bg-cobalt-100 text-cobalt-700 text-xs font-mono font-semibold transition-colors shadow-sm"
          >
            {copiedShare ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Verification</span>
              </>
            )}
          </button>

          <Link
            href={`/jobs/new?agent=${agentSlug}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-medium transition-colors shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Rerun Job</span>
          </Link>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="border-b border-slate-200 bg-porcelain-100 px-6 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("markdown")}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium border-b-2 transition-all ${
            activeTab === "markdown"
              ? "border-cobalt-500 text-cobalt-600 font-bold bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Executive Summary (Markdown)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("json")}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium border-b-2 transition-all ${
            activeTab === "json"
              ? "border-cobalt-500 text-cobalt-600 font-bold bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileJson className="w-4 h-4" />
          <span>Structured JSON Data Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("receipt")}
          className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-mono font-medium border-b-2 transition-all ${
            activeTab === "receipt"
              ? "border-cobalt-500 text-cobalt-600 font-bold bg-white"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Cryptographic SHA-256 Evidence Receipt</span>
        </button>
      </div>

      {/* Tab 1: Executive Summary Markdown */}
      {activeTab === "markdown" && (
        <div className="p-6">
          <div className="prose prose-slate max-w-none text-xs sm:text-sm font-sans leading-relaxed space-y-4">
            <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-5 space-y-3 font-mono text-xs">
              <div className="text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                Executive Verification Brief
              </div>
              <div className="whitespace-pre-wrap text-slate-800 leading-relaxed font-sans">
                {deliverable.summaryMarkdown}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Structured JSON Data Explorer */}
      {activeTab === "json" && (
        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">
              Raw Structured Output ({Object.keys(deliverable.structuredJson).length} top-level fields)
            </span>
            <button
              type="button"
              onClick={handleCopyJson}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 text-[11px] text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copied JSON</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-slate-800">
            {JSON.stringify(deliverable.structuredJson, null, 2)}
          </pre>
        </div>
      )}

      {/* Tab 3: Cryptographic SHA-256 Evidence Receipt */}
      {activeTab === "receipt" && (
        <div className="p-6 space-y-6">
          <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
                  SHA-256 Digest Integrity Receipt
                </span>
                <div className="font-mono text-xs text-slate-900 font-bold mt-0.5">
                  Receipt ID: {receipt?.receiptId || `rcpt_${integrityHash.slice(0, 16)}`}
                </div>
              </div>
              <Link
                href={`/verify?jobId=${jobId}&hash=${integrityHash}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-mono font-semibold hover:bg-emerald-100 transition-colors self-start sm:self-auto"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verify on Public Inspector</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[11px] uppercase mb-1">
                  Cryptographic Integrity Hash
                </span>
                <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg">
                  <span className="text-slate-900 font-mono text-xs truncate flex-1">
                    {integrityHash}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHash}
                    className="text-slate-400 hover:text-slate-700 p-1 shrink-0"
                    title="Copy Hash"
                  >
                    {copiedHash ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase">
                    Hash Scope Specification
                  </span>
                  <span className="text-slate-800 font-semibold text-[11px] break-all">
                    {receipt?.hashScope || "SHA256:CANONICAL_JSON(input,systemPrompt,executionLogs,deliverable,issuedAt)"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase">
                    Model Signature & Issued Timestamp
                  </span>
                  <span className="text-slate-800 font-semibold text-[11px]">
                    {deliverable.modelUsed} • {receipt?.issuedAt ? new Date(receipt.issuedAt).toLocaleString() : new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
