"use client";

import React, { useState } from "react";
import Link from "next/link";
import { EvidenceReceipt } from "@/server/engine/receipt";
import {
  FileText,
  User,
  ArrowRight,
  ChevronDown,
  Layers,
  Lock,
} from "lucide-react";

interface AuditTrailCardProps {
  receipt: EvidenceReceipt;
  jobId?: string;
  agentSlug?: string;
}

export function AuditTrailCard({ receipt, jobId, agentSlug }: AuditTrailCardProps) {
  const [showRawPayload, setShowRawPayload] = useState(false);
  const resolvedSlug = agentSlug || receipt.agentSlug;
  const resolvedJobId = jobId || receipt.jobId;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cobalt-500" />
          <h2 className="font-serif text-xl font-bold text-slate-900">
            Cryptographic Audit Trail
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Receipt ID: {receipt.receiptId}
        </span>
      </div>

      {/* Audit Meta Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-porcelain-100 rounded-xl p-3 space-y-1">
          <span className="text-slate-500 text-[11px] uppercase">Work Order ID</span>
          <div className="font-semibold text-slate-900 truncate">
            {resolvedJobId}
          </div>
        </div>

        <div className="bg-porcelain-100 rounded-xl p-3 space-y-1">
          <span className="text-slate-500 text-[11px] uppercase">Issued Timestamp</span>
          <div className="font-semibold text-slate-900">
            {new Date(receipt.issuedAt).toLocaleString()}
          </div>
        </div>

        <div className="bg-porcelain-100 rounded-xl p-3 space-y-1">
          <span className="text-slate-500 text-[11px] uppercase">Assigned Agent</span>
          <div className="font-semibold text-cobalt-600 truncate">
            {resolvedSlug}
          </div>
        </div>
      </div>

      {/* Verified Agent Link Banner */}
      {resolvedSlug && (
        <div className="p-4 bg-cobalt-50/70 border border-cobalt-100 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <User className="w-4 h-4 text-cobalt-600 shrink-0" />
            <div className="text-xs">
              <span className="text-slate-600">Verified Autonomous Agent: </span>
              <strong className="text-slate-900 font-mono">{resolvedSlug}</strong>
            </div>
          </div>
          <Link
            href={`/agents/${resolvedSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-cobalt-700 hover:text-cobalt-900 transition-colors shrink-0"
          >
            <span>View Portfolio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Scope Specification */}
      <div className="p-4 bg-porcelain-100 rounded-xl text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800 font-mono">
          <Lock className="w-4 h-4 text-cobalt-500" />
          <span>Canonical Hash Scope Declaration</span>
        </div>
        <p className="font-mono text-slate-600 text-[11px] break-all">
          {receipt.hashScope}
        </p>
      </div>

      {/* Collapsible Canonical Payload */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowRawPayload(!showRawPayload)}
          className="w-full px-4 py-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs font-mono font-semibold text-slate-700 transition-colors"
        >
          <span className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>Canonical Receipt Payload & Deliverable Envelope</span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${
              showRawPayload ? "rotate-180" : ""
            }`}
          />
        </button>

        {showRawPayload && (
          <div className="p-4 bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed border-t border-slate-800">
            <pre>{JSON.stringify(receipt.receiptData, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
