"use client";

import React, { useState, useEffect } from "react";
import {
  GatewayAuditRecord,
  GatewayPolicyConfig,
  InterceptResult,
} from "@/lib/contracts/gateway-types";
import { GatewayMonitor } from "./gateway-monitor";
import { MaskingSimulator } from "./masking-simulator";
import { PolicyControls } from "./policy-controls";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Eye,
  Sliders,
  Terminal,
  Activity,
  Layers,
  RefreshCw,
} from "lucide-react";

type GatewayConsoleView = "monitor" | "simulator" | "policy";

export function ToolGatewayConsole() {
  const [activeView, setActiveView] = useState<GatewayConsoleView>("monitor");
  const [auditLogs, setAuditLogs] = useState<GatewayAuditRecord[]>([]);
  const [stats, setStats] = useState({
    totalIntercepted: 0,
    allowed: 0,
    redacted: 0,
    blocked: 0,
    totalSecretsRedacted: 0,
    totalPiiMasked: 0,
    containmentRatePercent: 100,
  });
  const [policy, setPolicy] = useState<GatewayPolicyConfig>({
    zeroTrustPiiMasking: true,
    networkEgressContainment: true,
    consequentialStateMutationLock: true,
    allowedCapabilities: [],
    blockedOperations: [],
    allowedEgressDomains: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchGatewayState = async () => {
    try {
      const response = await fetch("/api/gateway/audit-logs?limit=100");
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.auditLogs);
        setStats(data.stats);
        if (data.policy) {
          setPolicy(data.policy);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tool gateway state:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayState();
  }, []);

  const handleInterceptCompleted = (result: InterceptResult) => {
    setAuditLogs((prev) => [result.auditRecord, ...prev]);
    setStats((prev) => ({
      ...prev,
      totalIntercepted: prev.totalIntercepted + 1,
      allowed: result.verdict === "ALLOWED" ? prev.allowed + 1 : prev.allowed,
      redacted: result.verdict === "REDACTED" ? prev.redacted + 1 : prev.redacted,
      blocked: result.verdict === "BLOCKED" ? prev.blocked + 1 : prev.blocked,
      totalSecretsRedacted:
        prev.totalSecretsRedacted +
        result.auditRecord.redactedDetails.filter((d) => d.category === "SECRET").length,
      totalPiiMasked:
        prev.totalPiiMasked +
        result.auditRecord.redactedDetails.filter((d) => d.category === "PII").length,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Enterprise KPI Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Intercepted */}
        <div className="p-4 rounded-xl border border-border-default bg-surface-primary">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Total Intercepted
            </span>
            <Activity className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {stats.totalIntercepted}
            </span>
            <span className="text-xs text-slate-500">invocations</span>
          </div>
        </div>

        {/* KPI 2: Secrets Redacted */}
        <div className="p-4 rounded-xl border border-border-default bg-surface-primary">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Secrets Neutralized
            </span>
            <Lock className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cobalt-700">
              {stats.totalSecretsRedacted}
            </span>
            <span className="text-xs text-slate-500">API keys &amp; tokens</span>
          </div>
        </div>

        {/* KPI 3: PII Masked */}
        <div className="p-4 rounded-xl border border-border-default bg-surface-primary">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              PII Masked
            </span>
            <Eye className="w-4 h-4 text-azure-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {stats.totalPiiMasked}
            </span>
            <span className="text-xs text-slate-500">cards &amp; emails</span>
          </div>
        </div>

        {/* KPI 4: Blocked Violations */}
        <div className="p-4 rounded-xl border border-border-default bg-surface-primary">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Calls Blocked
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-700">
              {stats.blocked}
            </span>
            <span className="text-xs text-slate-500">unauthorized</span>
          </div>
        </div>

        {/* KPI 5: Containment SLA */}
        <div className="p-4 rounded-xl border border-border-default bg-surface-primary col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              Containment SLA
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">
              {stats.containmentRatePercent}%
            </span>
            <span className="text-xs text-slate-500">zero-trust</span>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveView("monitor")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeView === "monitor"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Live Gateway Monitor</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("simulator")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeView === "simulator"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Data Masking Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView("policy")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeView === "policy"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Policy Guard Controls</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchGatewayState}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors font-mono self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Sub-view Content Panels */}
      {activeView === "monitor" && (
        <GatewayMonitor auditLogs={auditLogs} onRefresh={fetchGatewayState} />
      )}

      {activeView === "simulator" && (
        <MaskingSimulator onInterceptCompleted={handleInterceptCompleted} />
      )}

      {activeView === "policy" && (
        <PolicyControls
          policy={policy}
          onPolicyUpdated={(updated) => setPolicy(updated)}
        />
      )}
    </div>
  );
}
