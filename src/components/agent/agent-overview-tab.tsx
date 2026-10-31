"use client";

import React, { useState } from "react";
import { AgentPortfolioData } from "@/lib/agent-portfolio";
import { useCurrency } from "@/context/currency-context";
import {
  Zap,
  FileJson,
  Copy,
  Check,
  ShieldCheck,
  UserCheck,
  Cpu,
} from "lucide-react";

interface AgentOverviewTabProps {
  agent: AgentPortfolioData;
}

export function AgentOverviewTab({ agent }: AgentOverviewTabProps) {
  const { formatPrice } = useCurrency();
  const [copiedSchema, setCopiedSchema] = useState<"input" | "output" | null>(null);

  const handleCopySchema = (type: "input" | "output", data: unknown) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedSchema(type);
    setTimeout(() => setCopiedSchema(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* 1. Capabilities & Architecture Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <Cpu className="w-5 h-5 text-cobalt-500" />
          <h2 className="font-serif text-xl font-bold text-slate-900">
            Execution Architecture & Capabilities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Inference Runtime
            </h3>
            <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Model Engine:</span>
                <span className="font-mono font-semibold text-slate-900">{agent.modelUsed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Architecture:</span>
                <span className="font-mono font-semibold text-slate-900">{agent.runtimeType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Avg Execution Latency:</span>
                <span className="font-mono font-semibold text-slate-900">{agent.avgLatencyMs}ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">P95 Latency Threshold:</span>
                <span className="font-mono font-semibold text-slate-900">{agent.p95LatencyMs}ms</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-600">SLA Guarantee:</span>
                <span className="font-mono font-semibold text-emerald-700">99.95% Availability</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Supported Formats & I/O Protocol
            </h3>
            <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-600 block mb-1">Input Formats:</span>
                <div className="flex flex-wrap gap-1.5">
                  {agent.supportedInputFormats.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[11px]"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-600 block mb-1">Output Artifacts:</span>
                <div className="flex flex-wrap gap-1.5">
                  {agent.supportedOutputFormats.map((fmt) => (
                    <span
                      key={fmt}
                      className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-mono text-[11px]"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tagged Domain Capabilities */}
        <div>
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
            Declared Capabilities & Compliance Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {agent.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-lg bg-porcelain-100 text-slate-700 border border-slate-200 font-mono text-xs"
              >
                #{tag}
              </span>
            ))}
            {agent.capabilities.map((cap) => (
              <span
                key={cap}
                className="px-3 py-1 rounded-lg bg-cobalt-50 text-cobalt-700 border border-cobalt-100 font-mono text-xs"
              >
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Interactive Schema Specifications */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-cobalt-500" />
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Contract Schema Specifications
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">JSON Schema Draft-07</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Schema */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-800">
                Input Schema (Request Payload)
              </span>
              <button
                type="button"
                onClick={() => handleCopySchema("input", agent.inputSchema)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded border border-slate-200 bg-white"
              >
                {copiedSchema === "input" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
              {JSON.stringify(agent.inputSchema, null, 2)}
            </pre>
          </div>

          {/* Output Schema */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-800">
                Output Schema (Verified Deliverable)
              </span>
              <button
                type="button"
                onClick={() => handleCopySchema("output", agent.outputSchema)}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded border border-slate-200 bg-white"
              >
                {copiedSchema === "output" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-400" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
              {JSON.stringify(agent.outputSchema, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* 3. Creator Profile & Commercial Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Creator Studio Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-5 h-5 text-cobalt-500" />
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Creator Studio Profile
            </h2>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-base font-bold text-slate-900">{agent.authorName}</div>
              <div className="text-xs font-mono text-slate-500">{agent.builderStudio}</div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Verified autonomous agent builder publishing deterministic execution routines with cryptographic proof-of-work guarantees.
            </p>
            <div className="bg-porcelain-100 rounded-xl p-3 text-xs font-mono space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Verification Status:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Audited Builder</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span>Registered Agents:</span>
                <span className="font-semibold text-slate-900">Active Publisher</span>
              </div>
              <div className="flex justify-between">
                <span>Settlement Method:</span>
                <span className="font-semibold text-slate-900">Instant Dual-Ledger</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commercial & Escrow Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Zap className="w-5 h-5 text-cobalt-500" />
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Pricing & Escrow Economics
            </h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-slate-500">Task Price</span>
                <div className="font-mono text-2xl font-bold text-slate-900">
                  {formatPrice(agent.priceUsd)}
                </div>
              </div>
              <div className="text-right font-mono text-xs text-slate-500">
                <div>₹{agent.priceInr.toLocaleString("en-IN")}</div>
                <div>{agent.pricePaise.toLocaleString()} paise</div>
              </div>
            </div>

            <div className="bg-porcelain-100 rounded-xl p-3 text-xs font-mono space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span>Creator Earnings (85%):</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(agent.creatorPayoutUsd)} (₹{agent.creatorPayoutInr})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform Escrow Fee (15%):</span>
                <span className="font-semibold text-slate-900">
                  {formatPrice(agent.platformFeeUsd)} (₹{agent.platformFeeInr})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-normal">
                Funds remain locked in smart escrow until cryptographic SHA-256 evidence receipt is verified. Unresolved jobs auto-refund after 60 seconds.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
