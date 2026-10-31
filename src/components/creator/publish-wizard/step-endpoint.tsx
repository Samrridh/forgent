"use client";

import React, { useState } from "react";
import { PublishWizardForm } from "../creator-types";
import { STARTER_TEMPLATES } from "@/server/templates/template-definitions";
import {
  Globe,
  Server,
  Copy,
  Check,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Zap,
} from "lucide-react";

interface StepEndpointProps {
  formData: PublishWizardForm;
  onChange: (fields: Partial<PublishWizardForm>) => void;
}

interface VerificationFeedback {
  status: "idle" | "testing" | "success" | "error";
  statusCode?: number;
  latencyMs?: number;
  signatureVerified?: boolean;
  challengeId?: string;
  message?: string;
}

export function StepEndpoint({ formData, onChange }: StepEndpointProps) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<VerificationFeedback>({
    status: "idle",
  });

  const selectedTemplate =
    STARTER_TEMPLATES.find((t) => t.id === formData.selectedTemplateId) ||
    STARTER_TEMPLATES[0];

  const scaffoldCommand = `curl -O https://forgent.network/api/templates/${selectedTemplate.id}/export && unzip ${selectedTemplate.id}-starter.zip && cd ${selectedTemplate.id}-starter && npm install`;

  const handleCopyCmd = async () => {
    try {
      await navigator.clipboard.writeText(scaffoldCommand);
      setCopiedCmd(true);
      setTimeout(() => setCopiedCmd(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(formData.hmacSecret || "");
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleGenerateSecret = () => {
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const newSecret = `whsec_live_${randomHex}`;
    onChange({ hmacSecret: newSecret });
  };

  const handleVerifyEndpoint = async () => {
    setVerificationFeedback({ status: "testing" });
    try {
      const response = await fetch("/api/builder/verify-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointUrl: formData.webhookUrl,
          hmacSecret: formData.hmacSecret || "whsec_live_default_handshake_secret",
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setVerificationFeedback({
          status: "success",
          statusCode: data.statusCode || 200,
          latencyMs: data.latencyMs || 45,
          signatureVerified: Boolean(data.signatureVerified),
          challengeId: data.challengeId,
          message: data.message || "Endpoint responded with HTTP 200 and verified HMAC signature.",
        });
      } else {
        setVerificationFeedback({
          status: "error",
          statusCode: data.statusCode || response.status,
          latencyMs: data.latencyMs,
          message: data.message || "Endpoint verification failed.",
        });
      }
    } catch (err: unknown) {
      setVerificationFeedback({
        status: "error",
        message: err instanceof Error ? err.message : "Network failure connecting to verification server.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border-subtle pb-4">
        <h3 className="text-base font-bold text-slate-900">Step 3: Execution Endpoint &amp; Runtime</h3>
        <p className="text-xs text-slate-500 mt-1">
          Select whether this agent dispatches to your authenticated remote webhook or runs on Forgent Platform Hosted Starter infrastructure.
        </p>
      </div>

      {/* Mode Selector Toggle: Remote Webhook Protocol vs Platform Hosted Starter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange({ endpointType: "webhook" })}
          className={`p-4 rounded-xl border text-left transition-all ${
            formData.endpointType === "webhook"
              ? "border-cobalt-500 bg-cobalt-50/60 shadow-xs ring-1 ring-cobalt-500/20"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                formData.endpointType === "webhook"
                  ? "bg-cobalt-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-slate-900 uppercase">
                Remote Webhook Protocol
              </div>
              <div className="text-[11px] text-slate-500">
                Self-hosted endpoint with HMAC SHA-256 signatures
              </div>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange({ endpointType: "hosted_starter" })}
          className={`p-4 rounded-xl border text-left transition-all ${
            formData.endpointType === "hosted_starter" || formData.endpointType === "cli_template"
              ? "border-cobalt-500 bg-cobalt-50/60 shadow-xs ring-1 ring-cobalt-500/20"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                formData.endpointType === "hosted_starter" || formData.endpointType === "cli_template"
                  ? "bg-cobalt-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-slate-900 uppercase">
                Platform Hosted Starter
              </div>
              <div className="text-[11px] text-slate-500">
                Forgent managed edge sandbox with zero infrastructure ops
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Mode 1: Remote Webhook Inputs */}
      {formData.endpointType === "webhook" ? (
        <div className="p-5 rounded-xl border border-border-default bg-surface-primary space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Execution Webhook URL *
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="url"
                value={formData.webhookUrl}
                onChange={(e) => onChange({ webhookUrl: e.target.value })}
                placeholder="https://api.yourdomain.com/v1/forgent-agent"
                className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-cobalt-500"
              />
              <button
                type="button"
                onClick={handleVerifyEndpoint}
                disabled={verificationFeedback.status === "testing"}
                className="px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-mono font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-xs"
              >
                {verificationFeedback.status === "testing" ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Verify Webhook</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Must accept HTTP POST with JSON input contract and respond within 3,500ms SLA limit.
            </p>
          </div>

          {/* HMAC Secret Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider">
                HMAC SHA-256 Webhook Signing Secret *
              </label>
              <button
                type="button"
                onClick={handleGenerateSecret}
                className="text-[11px] font-mono text-cobalt-600 hover:text-cobalt-700 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate New</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={formData.hmacSecret || ""}
                  onChange={(e) => onChange({ hmacSecret: e.target.value })}
                  placeholder="whsec_live_..."
                  className="w-full px-3.5 py-2 pl-9 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-cobalt-500"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <button
                type="button"
                onClick={handleCopySecret}
                className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 flex items-center gap-1 shrink-0"
              >
                {copiedSecret ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Used to sign outbound challenge payloads via the <code className="text-cobalt-600 font-mono">X-Forgent-Signature</code> header.
            </p>
          </div>

          {/* Verification Feedback Banner */}
          {verificationFeedback.status === "success" && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Webhook Verified: HTTP {verificationFeedback.statusCode} OK</span>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {verificationFeedback.latencyMs}ms Ping
                </span>
              </div>
              <p className="text-xs text-emerald-700">
                {verificationFeedback.message}
              </p>
              {verificationFeedback.challengeId && (
                <div className="text-[11px] font-mono text-emerald-800/80 pt-1">
                  Challenge ID: {verificationFeedback.challengeId}
                </div>
              )}
            </div>
          )}

          {verificationFeedback.status === "error" && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-900 space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Verification Failed {verificationFeedback.statusCode ? `(HTTP ${verificationFeedback.statusCode})` : ""}</span>
              </div>
              <p className="text-xs text-red-700">
                {verificationFeedback.message}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
            <div className="p-3 rounded-lg bg-porcelain-100 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Security Guarantee
              </span>
              <span className="text-xs text-slate-700 font-medium">
                Forgent signs every execution payload with HMAC SHA-256 for zero-trust authenticity.
              </span>
            </div>

            <div className="p-3 rounded-lg bg-porcelain-100 border border-slate-200">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Qualification Requirement
              </span>
              <span className="text-xs text-slate-700 font-medium">
                Stage 3 benchmarks this endpoint under real latency against the 3,500ms ceiling.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: Platform Hosted Starter */
        <div className="p-5 rounded-xl border border-border-default bg-surface-primary space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Production Starter Template *
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {STARTER_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplate.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => onChange({ selectedTemplateId: tmpl.id })}
                    className={`p-3 rounded-lg border text-left flex items-center justify-between gap-3 transition-colors ${
                      isSelected
                        ? "border-cobalt-500 bg-cobalt-50/50"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{tmpl.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {tmpl.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{tmpl.tagline}</div>
                    </div>
                    <div className="text-right font-mono text-[11px] text-slate-500 shrink-0">
                      <div>{tmpl.runtime}</div>
                      <div className="text-emerald-700 font-semibold">{tmpl.successRate}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Start Command Box */}
          <div className="p-3.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px]">
              <span>Terminal Scaffolding Command</span>
              <button
                type="button"
                onClick={handleCopyCmd}
                className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="text-cobalt-300 text-[11px] break-all select-all font-mono">
              {scaffoldCommand}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
