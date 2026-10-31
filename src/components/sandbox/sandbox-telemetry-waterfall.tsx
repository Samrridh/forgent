"use client";

import React from "react";
import { LatencyWaterfall } from "@/lib/contracts/sandbox-types";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Cpu,
  Zap,
} from "lucide-react";

interface SandboxTelemetryWaterfallProps {
  waterfall?: LatencyWaterfall;
  isLoading?: boolean;
}

export function SandboxTelemetryWaterfall({
  waterfall,
  isLoading = false,
}: SandboxTelemetryWaterfallProps) {
  if (!waterfall) {
    return (
      <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
        <Activity className="w-8 h-8 mx-auto mb-2 text-slate-400 stroke-[1.5]" />
        <div className="text-sm font-medium text-slate-700">No Telemetry Recorded</div>
        <div className="text-xs text-slate-400 mt-1">
          Execute a sandbox run to profile latency waterfall and SLA margins.
        </div>
      </div>
    );
  }

  const {
    dnsConnectMs,
    gatewayMs,
    ttftMs,
    generationMs,
    totalLatencyMs,
    slaThresholdMs,
    slaViolated,
  } = waterfall;

  const total = Math.max(totalLatencyMs, slaThresholdMs, 1);
  const dnsPct = Math.max(2, (dnsConnectMs / total) * 100);
  const gatewayPct = Math.max(2, (gatewayMs / total) * 100);
  const ttftPct = Math.max(4, (ttftMs / total) * 100);
  const genPct = Math.max(4, (generationMs / total) * 100);
  const slaThresholdPct = Math.min(100, (slaThresholdMs / total) * 100);

  const phases = [
    {
      id: "dns",
      name: "DNS & Provider Handshake",
      latencyMs: dnsConnectMs,
      pct: ((dnsConnectMs / totalLatencyMs) * 100).toFixed(1),
      icon: Zap,
      color: "bg-slate-400",
      description: "Network route resolution and provider TLS handshake.",
    },
    {
      id: "gateway",
      name: "Tool Gateway Inspection",
      latencyMs: gatewayMs,
      pct: ((gatewayMs / totalLatencyMs) * 100).toFixed(1),
      icon: ShieldCheck,
      color: "bg-cobalt-500",
      description: "Zero-trust policy validation, credential protection, and PII masking.",
    },
    {
      id: "ttft",
      name: "Time-to-First-Token (TTFT)",
      latencyMs: ttftMs,
      pct: ((ttftMs / totalLatencyMs) * 100).toFixed(1),
      icon: Cpu,
      color: "bg-azure-500",
      description: "Prompt parsing, KV cache loading, and initial token emit.",
    },
    {
      id: "gen",
      name: "Token Generation & Stream",
      latencyMs: generationMs,
      pct: ((generationMs / totalLatencyMs) * 100).toFixed(1),
      icon: Clock,
      color: "bg-cobalt-700",
      description: "Autoregressive token emission and output schema synthesis.",
    },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header & SLA Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cobalt-50 border border-cobalt-200 flex items-center justify-center text-cobalt-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Execution Latency Waterfall
            </h3>
            <p className="text-xs text-slate-500">
              Millisecond profiling across transport, security, and generation phases
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoading && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-cobalt-600 animate-pulse mr-1">
              <Activity className="w-3 h-3" /> PROFILING...
            </span>
          )}
          {slaViolated ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              SLA VIOLATION ({totalLatencyMs}ms &gt; {slaThresholdMs}ms)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              SLA PASSED ({totalLatencyMs}ms &le; {slaThresholdMs}ms)
            </span>
          )}
        </div>
      </div>

      {/* Visual Timeline Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono text-slate-500">
          <span>0ms</span>
          <span className="font-semibold text-slate-900">{totalLatencyMs}ms Total</span>
          <span className="text-slate-400">Ceiling: {slaThresholdMs}ms</span>
        </div>

        <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden flex border border-slate-200 shadow-inner">
          <div
            style={{ width: `${dnsPct}%` }}
            className="h-full bg-slate-400 hover:opacity-90 transition-all relative group cursor-pointer"
            title={`DNS: ${dnsConnectMs}ms`}
          />
          <div
            style={{ width: `${gatewayPct}%` }}
            className="h-full bg-cobalt-500 hover:opacity-90 transition-all relative group cursor-pointer"
            title={`Tool Gateway: ${gatewayMs}ms`}
          />
          <div
            style={{ width: `${ttftPct}%` }}
            className="h-full bg-azure-500 hover:opacity-90 transition-all relative group cursor-pointer"
            title={`TTFT: ${ttftMs}ms`}
          />
          <div
            style={{ width: `${genPct}%` }}
            className="h-full bg-cobalt-700 hover:opacity-90 transition-all relative group cursor-pointer"
            title={`Generation: ${generationMs}ms`}
          />

          {/* SLA Threshold Marker Line */}
          {slaThresholdPct <= 100 && (
            <div
              style={{ left: `${slaThresholdPct}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
              title={`SLA Ceiling: ${slaThresholdMs}ms`}
            />
          )}
        </div>
      </div>

      {/* Waterfall Phase Breakdown Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {phases.map((phase) => {
          const Icon = phase.icon;
          return (
            <div
              key={phase.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-porcelain-100/60 hover:bg-porcelain-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 text-slate-700" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {phase.name}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {phase.latencyMs}ms
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({phase.pct}%)
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {phase.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* SLA Margin Footnote */}
      <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-100">
        <span>SLA Headroom Margin:</span>
        <span className={slaViolated ? "text-rose-600 font-bold" : "text-emerald-700 font-semibold"}>
          {slaViolated
            ? `+${totalLatencyMs - slaThresholdMs}ms overrun`
            : `${slaThresholdMs - totalLatencyMs}ms remaining`}
        </span>
      </div>
    </div>
  );
}
