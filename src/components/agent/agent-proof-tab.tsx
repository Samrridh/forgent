"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AgentPortfolioData } from "@/lib/agent-portfolio";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Clock,
  Lock,
} from "lucide-react";

interface AgentProofTabProps {
  agent: AgentPortfolioData;
}

export function AgentProofTab({ agent }: AgentProofTabProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* 1. Benchmark Test Results Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Benchmark Verification Results
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Accuracy: {agent.benchmarkScore}% pass rate</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
          All benchmark suites are executed across randomized edge-case fixtures and verified against deterministic invariants. Outputs are validated for schema adherence, zero float rounding variance, and strict parameter bounds.
        </p>

        {/* Test Suites Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-porcelain-100 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-4 font-semibold">Test Suite Specification</th>
                <th className="py-2.5 px-4 font-semibold">Test Count</th>
                <th className="py-2.5 px-4 font-semibold">Pass Rate</th>
                <th className="py-2.5 px-4 font-semibold text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {agent.benchmarkTestSuites.map((suite, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {suite.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {suite.testCount} cases
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${suite.passRate * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-emerald-700">
                        {Math.round(suite.passRate * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      <Check className="w-3 h-3" />
                      <span>PASS</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100">
          <span>Last Audited: {new Date(agent.lastVerifiedAt).toLocaleString()}</span>
          <span>Verification Engine: SHA-256 Canonical JSON Digest</span>
        </div>
      </div>

      {/* 2. Cryptographic Execution History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cobalt-500" />
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Verified Execution History & Cryptographic Receipts
            </h2>
          </div>
          <Link
            href="/verify"
            className="text-xs font-mono text-cobalt-600 hover:text-cobalt-800 transition-colors inline-flex items-center gap-1"
          >
            <span>Public Inspector</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Historical work order executions completed by this agent. Every execution is sealed with an immutable SHA-256 evidence receipt linking the canonical input payload, runtime system prompt, execution logs, and deliverable output.
        </p>

        {/* Execution Receipts Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-porcelain-100 border-b border-slate-200 text-slate-600 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-4 font-semibold">Job ID & Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Latency</th>
                <th className="py-2.5 px-4 font-semibold">SHA-256 Evidence Receipt</th>
                <th className="py-2.5 px-4 font-semibold text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {agent.recentExecutions.map((exec) => (
                <tr key={exec.jobId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{exec.jobId}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(exec.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{exec.latencyMs}ms</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-700 truncate max-w-[200px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {exec.integrityHash}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(exec.integrityHash)}
                        className="text-slate-400 hover:text-slate-700 p-1"
                        title="Copy SHA-256 Hash"
                      >
                        {copiedHash === exec.integrityHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/verify?hash=${exec.integrityHash}`}
                      className="inline-flex items-center gap-1 text-[11px] text-cobalt-600 hover:text-cobalt-800 bg-cobalt-50 hover:bg-cobalt-100 px-2.5 py-1 rounded border border-cobalt-200 font-semibold transition-colors"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Inspect</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Mathematical Proof Architecture Note */}
      <div className="bg-porcelain-100 border border-slate-200 rounded-2xl p-6 text-xs space-y-2">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <Lock className="w-4 h-4 text-cobalt-500" />
          <span>Cryptographic Hash Scope Declaration</span>
        </div>
        <p className="text-slate-600 leading-relaxed font-mono">
          SHA256:CANONICAL_JSON(input, systemPrompt, executionLogs, deliverable, issuedAt)
        </p>
        <p className="text-slate-500 leading-relaxed text-[11px]">
          All JSON payloads are sorted recursively by object keys prior to digest computation. Recomputing the hash over the deliverable envelope guarantees mathematical proof that neither inputs nor outputs were altered after task execution.
        </p>
      </div>
    </div>
  );
}
