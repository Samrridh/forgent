"use client";

import React, { useState } from "react";
import { ToolInspectionResult } from "@/lib/contracts/sandbox-types";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Copy,
  Check,
  KeyRound,
  FileText,
  AlertCircle,
} from "lucide-react";

interface SandboxToolInspectorProps {
  inspection?: ToolInspectionResult;
}

export function SandboxToolInspector({ inspection }: SandboxToolInspectorProps) {
  const [copied, setCopied] = useState(false);

  if (!inspection) {
    return (
      <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-6 text-center text-slate-500">
        <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-400 stroke-[1.5]" />
        <div className="text-sm font-medium text-slate-700">Tool Gateway Dormant</div>
        <div className="text-xs text-slate-400 mt-1">
          Provide a test tool invocation payload to inspect zero-trust PII masking and credential redaction.
        </div>
      </div>
    );
  }

  const {
    rawPayload,
    sanitizedPayload,
    verdict,
    redactedKeys,
    policyEvaluations,
    blockedReason,
    executionLatencyMs,
  } = inspection;

  const handleCopySanitized = () => {
    navigator.clipboard.writeText(JSON.stringify(sanitizedPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verdictStyles: Record<string, { bg: string; text: string; border: string }> = {
    ALLOWED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    },
    REDACTED: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
    },
    BLOCKED: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    },
  };

  const currentVerdict = verdictStyles[verdict] || verdictStyles.ALLOWED;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header & Verdict */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cobalt-50 border border-cobalt-200 flex items-center justify-center text-cobalt-600">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
              Tool Gateway Security Inspection
            </h3>
            <p className="text-xs text-slate-500">
              Zero-trust PII sanitization and consequential state containment preview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${currentVerdict.bg} ${currentVerdict.text} ${currentVerdict.border}`}
          >
            {verdict === "BLOCKED" ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-cobalt-600" />
            )}
            GATEWAY VERDICT: {verdict}
          </span>
          <span className="text-xs font-mono text-slate-500 px-2 py-0.5 rounded bg-slate-100">
            {executionLatencyMs}ms
          </span>
        </div>
      </div>

      {/* Blocked Reason Alert (if blocked) */}
      {blockedReason && (
        <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Security Policy Interception:</div>
            <div>{blockedReason}</div>
          </div>
        </div>
      )}

      {/* Policy Evaluation Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="p-2.5 rounded-lg border border-slate-100 bg-porcelain-100">
          <div className="text-[10px] uppercase font-mono text-slate-400">PII Masked</div>
          <div className="font-semibold text-slate-800 mt-0.5">
            {policyEvaluations.piiMasked ? "ACTIVE" : "NONE_DETECTED"}
          </div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-100 bg-porcelain-100">
          <div className="text-[10px] uppercase font-mono text-slate-400">Secrets Redacted</div>
          <div className="font-semibold text-slate-800 mt-0.5">
            {policyEvaluations.secretsRedacted ? "REDACTED" : "NONE_DETECTED"}
          </div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-100 bg-porcelain-100">
          <div className="text-[10px] uppercase font-mono text-slate-400">Scope Authorized</div>
          <div className={`font-semibold mt-0.5 ${policyEvaluations.scopeAuthorized ? "text-emerald-700" : "text-rose-700"}`}>
            {policyEvaluations.scopeAuthorized ? "CONFIRMED" : "DENIED"}
          </div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-100 bg-porcelain-100">
          <div className="text-[10px] uppercase font-mono text-slate-400">Egress Boundary</div>
          <div className={`font-semibold mt-0.5 ${policyEvaluations.egressContained ? "text-emerald-700" : "text-rose-700"}`}>
            {policyEvaluations.egressContained ? "CONTAINED" : "BREACH"}
          </div>
        </div>
        <div className="p-2.5 rounded-lg border border-slate-100 bg-porcelain-100">
          <div className="text-[10px] uppercase font-mono text-slate-400">Mutation Lock</div>
          <div className="font-semibold text-slate-800 mt-0.5">
            {policyEvaluations.stateMutationLocked ? "LOCKED" : "UNRESTRICTED"}
          </div>
        </div>
      </div>

      {/* Redacted Keys Indicator */}
      {redactedKeys.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            Redacted Attributes ({redactedKeys.length}):
          </span>
          {redactedKeys.map((key) => (
            <span
              key={key}
              className="px-2 py-0.5 rounded font-mono text-[11px] bg-amber-50 text-amber-800 border border-amber-200"
            >
              {key}
            </span>
          ))}
        </div>
      )}

      {/* Side-by-Side Payload Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
        {/* Raw Inbound Payload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Raw Input Payload (Pre-Sanitization)
            </span>
            <span className="text-[10px] font-mono text-slate-400">Original JSON</span>
          </div>
          <div className="h-64 rounded-lg bg-slate-900 text-slate-100 p-3.5 font-mono text-xs overflow-auto border border-slate-800">
            <pre>{JSON.stringify(rawPayload, null, 2)}</pre>
          </div>
        </div>

        {/* Sanitized Output Payload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cobalt-600" />
              Sanitized Output Payload (Post-Gateway)
            </span>
            <button
              type="button"
              onClick={handleCopySanitized}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-cobalt-600 hover:text-cobalt-700"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          </div>
          <div className="h-64 rounded-lg bg-slate-900 text-emerald-300 p-3.5 font-mono text-xs overflow-auto border border-slate-800">
            <pre>{JSON.stringify(sanitizedPayload, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
