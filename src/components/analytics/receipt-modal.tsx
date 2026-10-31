"use client";

import React, { useState } from "react";
import { LeaderboardAgent } from "@/server/analytics/leaderboard-engine";
import { ShieldCheck, CheckCircle2, Copy, Check, X, Hash, Clock, Cpu } from "lucide-react";

interface ReceiptModalProps {
  agent: LeaderboardAgent | null;
  onClose: () => void;
}

export function ReceiptModal({ agent, onClose }: ReceiptModalProps) {
  const [copied, setCopied] = useState(false);

  if (!agent) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(agent.receiptHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cobalt-50 text-cobalt-600 flex items-center justify-center border border-cobalt-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="receipt-modal-title"
                className="font-serif text-lg font-bold text-slate-900 leading-tight"
              >
                Cryptographic Benchmark Receipt
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                SHA-256 Canonical JSON Proof of Qualification
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close receipt modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Verification Status Pill */}
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">Cryptographically Verified Receipt</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
            Integrity 100%
          </span>
        </div>

        {/* Agent Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-porcelain-100 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] block mb-0.5">
              Agent Title
            </span>
            <span className="font-semibold text-slate-900 line-clamp-1">
              {agent.name}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-porcelain-100 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] block mb-0.5">
              Domain / Author
            </span>
            <span className="font-semibold text-slate-900">
              {agent.category} • {agent.authorName}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-porcelain-100 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] block mb-0.5">
              Trust Index &amp; Pass Rate
            </span>
            <span className="font-bold text-cobalt-700">
              {agent.trustIndex} / 100 ({agent.qualificationPassRate}% pass)
            </span>
          </div>
          <div className="p-3 rounded-lg bg-porcelain-100 border border-slate-200">
            <span className="text-slate-500 uppercase text-[10px] block mb-0.5">
              SLA Latency (p50 / p95)
            </span>
            <span className="font-bold text-slate-900">
              {agent.p50LatencyMs}ms / {agent.p95LatencyMs}ms
            </span>
          </div>
        </div>

        {/* Hash Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 uppercase">
            <span className="flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-slate-400" />
              <span>SHA-256 Digest (Digest Scope: Canonical Proof)</span>
            </span>
            <button
              type="button"
              onClick={handleCopyHash}
              className="flex items-center gap-1 text-cobalt-600 hover:text-cobalt-800 font-semibold transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Digest</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs break-all border border-slate-800 select-all">
            {agent.receiptHash}
          </div>
        </div>

        {/* Audit Details */}
        <div className="text-[11px] text-slate-500 font-mono space-y-1 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Verified Timestamp:</span>
            </span>
            <span className="text-slate-700 font-medium">{agent.verifiedAt}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Standard:</span>
            </span>
            <span className="text-slate-700 font-medium">NIST FIPS 180-4 Canonical SHA-256</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-mono transition-colors"
          >
            Close Receipt Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
