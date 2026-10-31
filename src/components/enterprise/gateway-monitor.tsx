"use client";

import React, { useState } from "react";
import { GatewayAuditRecord, PolicyVerdict } from "@/lib/contracts/gateway-types";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Clock,
  Cpu,
  Lock,
  X,
  FileCode,
} from "lucide-react";

interface GatewayMonitorProps {
  auditLogs: GatewayAuditRecord[];
  onRefresh?: () => void;
}

export function GatewayMonitor({ auditLogs }: GatewayMonitorProps) {
  const [selectedVerdict, setSelectedVerdict] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inspectingRecord, setInspectingRecord] = useState<GatewayAuditRecord | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesVerdict =
      selectedVerdict === "ALL" || log.verdict === selectedVerdict;
    const matchesSearch =
      searchQuery.trim() === "" ||
      log.callerAgentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.operation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.blockedReason &&
        log.blockedReason.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesVerdict && matchesSearch;
  });

  const getVerdictBadge = (verdict: PolicyVerdict) => {
    switch (verdict) {
      case "ALLOWED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span>ALLOWED</span>
          </span>
        );
      case "REDACTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-cobalt-50 text-cobalt-700 border border-cobalt-200">
            <Lock className="w-3 h-3 text-cobalt-600" />
            <span>REDACTED</span>
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            <span>BLOCKED</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between bg-surface-primary p-4 rounded-xl border border-border-default">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by agent ID, tool name, or operation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cobalt-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {(["ALL", "ALLOWED", "REDACTED", "BLOCKED"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setSelectedVerdict(v)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition-colors whitespace-nowrap ${
                selectedVerdict === v
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="border border-border-default rounded-xl bg-surface-primary overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-border-default flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Tool Gateway Interception Ledger
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live zero-trust audit trail of intercepted agent tool invocations, sanitization operations, and rejected scopes.
            </p>
          </div>
          <span className="font-mono text-xs text-slate-500">
            {filteredLogs.length} events logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-border-default text-slate-600 font-mono">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Caller Agent</th>
                <th className="py-3 px-4 font-semibold">Tool &amp; Operation</th>
                <th className="py-3 px-4 font-semibold">Policy Verdict</th>
                <th className="py-3 px-4 font-semibold">Redactions</th>
                <th className="py-3 px-4 font-semibold">Latency</th>
                <th className="py-3 px-4 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No intercepted tool events matched the specified filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.callerAgentId}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">
                          {log.toolName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {log.operation}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getVerdictBadge(log.verdict)}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.redactedKeys.length > 0 ? (
                        <span className="text-cobalt-700 bg-cobalt-50 px-2 py-0.5 rounded text-[11px] border border-cobalt-200">
                          {log.redactedKeys.length} masked
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {log.executionLatencyMs}ms
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectingRecord(log)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-sans text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Modal */}
      {inspectingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cobalt-600" />
                <h3 className="text-sm font-semibold text-slate-900 font-sans">
                  Security Interception Audit Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Verdict</span>
                  <div className="mt-1">{getVerdictBadge(inspectingRecord.verdict)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Tool</span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {inspectingRecord.toolName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Operation</span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {inspectingRecord.operation}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Agent ID</span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {inspectingRecord.callerAgentId}
                  </span>
                </div>
              </div>

              {/* Blocked Reason Alert */}
              {inspectingRecord.blockedReason && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Security Policy Violation</span>
                  </div>
                  <p className="font-mono text-xs">{inspectingRecord.blockedReason}</p>
                </div>
              )}

              {/* Redacted Keys List */}
              {inspectingRecord.redactedKeys.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-700">Redacted Secret &amp; PII Keys:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectingRecord.redactedKeys.map((key) => (
                      <span
                        key={key}
                        className="px-2 py-0.5 rounded font-mono text-xs bg-cobalt-50 text-cobalt-700 border border-cobalt-200"
                      >
                        {key}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Payload Previews */}
              <div className="space-y-3 pt-2">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Sanitized Payload (Passed to Tool):
                  </span>
                  <pre className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                    {JSON.stringify(inspectingRecord.sanitizedPayload, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Policy Evaluation Checklist */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <span className="font-semibold text-slate-700 font-sans block mb-1">
                  Policy Evaluations:
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className={inspectingRecord.policyEvaluations.scopeAuthorized ? "text-emerald-600" : "text-rose-600"}>
                      {inspectingRecord.policyEvaluations.scopeAuthorized ? "[x]" : "[!]"}
                    </span>
                    <span>Scope Authorized</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={inspectingRecord.policyEvaluations.secretsRedacted ? "text-cobalt-600" : "text-slate-400"}>
                      {inspectingRecord.policyEvaluations.secretsRedacted ? "[x]" : "[o]"}
                    </span>
                    <span>Secrets Scanned &amp; Masked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={inspectingRecord.policyEvaluations.piiMasked ? "text-cobalt-600" : "text-slate-400"}>
                      {inspectingRecord.policyEvaluations.piiMasked ? "[x]" : "[o]"}
                    </span>
                    <span>PII Masked</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={inspectingRecord.policyEvaluations.egressContained ? "text-emerald-600" : "text-rose-600"}>
                      {inspectingRecord.policyEvaluations.egressContained ? "[x]" : "[!]"}
                    </span>
                    <span>Egress Contained</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingRecord(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Close Audit Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
