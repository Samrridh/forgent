"use client";

import React, { useState } from "react";
import {
  EnterprisePolicyConfig,
  Jurisdiction,
  ProviderFilterMode,
} from "@/lib/contracts/compliance-types";
import {
  Clock,
  Coins,
  Globe,
  Cpu,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";

interface PolicyRulesEditorProps {
  initialPolicy: EnterprisePolicyConfig;
  onPolicyUpdated?: (updated: EnterprisePolicyConfig) => void;
}

const AVAILABLE_JURISDICTIONS: Jurisdiction[] = ["US", "EU", "INDIA"];
const COMMON_PROVIDERS = [
  "OPENAI",
  "ANTHROPIC",
  "GOOGLE",
  "AWS_BEDROCK",
  "MICROSOFT_AZURE",
  "DEEPSEEK",
  "UNVERIFIED_COMMUNITY",
];

export function PolicyRulesEditor({
  initialPolicy,
  onPolicyUpdated,
}: PolicyRulesEditorProps) {
  const [policy, setPolicy] = useState<EnterprisePolicyConfig>(initialPolicy);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Latency SLA State
  const [latencySlaCeilingMs, setLatencySlaCeilingMs] = useState(
    policy.latencySlaCeilingMs
  );

  // Budget Cap State
  const [maxBudgetUsd, setMaxBudgetUsd] = useState(
    Math.round(policy.budgetCap.maxBudgetPaise / 8000)
  );
  const [requireApprovalUsd, setRequireApprovalUsd] = useState(
    Math.round(policy.budgetCap.requireApprovalAbovePaise / 8000)
  );

  // Data Residency State
  const [primaryJurisdiction, setPrimaryJurisdiction] = useState<Jurisdiction>(
    policy.dataResidency.primaryJurisdiction
  );
  const [enforceSovereignty, setEnforceSovereignty] = useState(
    policy.dataResidency.enforceSovereignty
  );
  const [allowedJurisdictions, setAllowedJurisdictions] = useState<Jurisdiction[]>(
    policy.dataResidency.allowedJurisdictions
  );

  // Provider Governance State
  const [providerMode, setProviderMode] = useState<ProviderFilterMode>(
    policy.providers.mode
  );
  const [allowedProviders, setAllowedProviders] = useState<string[]>(
    policy.providers.allowedProviders
  );
  const [forbiddenProviders, setForbiddenProviders] = useState<string[]>(
    policy.providers.forbiddenProviders
  );

  // HITL State
  const [requireCheckpointMutation, setRequireCheckpointMutation] = useState(
    policy.humanInTheLoop.requireCheckpointOnStateMutation
  );
  const [requireCheckpointPayment, setRequireCheckpointPayment] = useState(
    policy.humanInTheLoop.requireCheckpointOnPaymentAbovePaise > 0
  );
  const [requireCheckpointPii, setRequireCheckpointPii] = useState(
    policy.humanInTheLoop.requireCheckpointOnPiiExport
  );
  const [requireCheckpointWebhook, setRequireCheckpointWebhook] = useState(
    policy.humanInTheLoop.requireCheckpointOnExternalWebhook
  );

  const toggleJurisdiction = (j: Jurisdiction) => {
    if (allowedJurisdictions.includes(j)) {
      if (allowedJurisdictions.length > 1) {
        setAllowedJurisdictions(allowedJurisdictions.filter((x) => x !== j));
      }
    } else {
      setAllowedJurisdictions([...allowedJurisdictions, j]);
    }
  };

  const toggleProvider = (p: string) => {
    if (providerMode === "BLACKLIST") {
      if (forbiddenProviders.includes(p)) {
        setForbiddenProviders(forbiddenProviders.filter((x) => x !== p));
      } else {
        setForbiddenProviders([...forbiddenProviders, p]);
      }
    } else {
      if (allowedProviders.includes(p)) {
        setAllowedProviders(allowedProviders.filter((x) => x !== p));
      } else {
        setAllowedProviders([...allowedProviders, p]);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveBanner(null);
    setErrorBanner(null);

    const payload: Partial<EnterprisePolicyConfig> = {
      latencySlaCeilingMs,
      budgetCap: {
        maxBudgetPaise: maxBudgetUsd * 8000,
        requireApprovalAbovePaise: requireApprovalUsd * 8000,
        currency: "USD",
      },
      dataResidency: {
        primaryJurisdiction,
        enforceSovereignty,
        allowedJurisdictions,
      },
      providers: {
        mode: providerMode,
        allowedProviders,
        forbiddenProviders,
        allowedModels: policy.providers.allowedModels,
        forbiddenModels: policy.providers.forbiddenModels,
      },
      humanInTheLoop: {
        ...policy.humanInTheLoop,
        requireCheckpointOnStateMutation: requireCheckpointMutation,
        requireCheckpointOnPaymentAbovePaise: requireCheckpointPayment ? 4000000 : 0,
        requireCheckpointOnPiiExport: requireCheckpointPii,
        requireCheckpointOnExternalWebhook: requireCheckpointWebhook,
      },
    };

    try {
      const res = await fetch("/api/enterprise/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.policy) {
        setPolicy(data.policy);
        if (onPolicyUpdated) onPolicyUpdated(data.policy);
        setSaveBanner("Enterprise compliance policies synchronized and actively enforced across all runner nodes.");
        setTimeout(() => setSaveBanner(null), 4000);
      } else {
        setErrorBanner(data.error || "Failed to update enterprise policy");
      }
    } catch {
      setErrorBanner("Failed to communicate with policy engine route");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setSaveBanner(null);
    setErrorBanner(null);

    try {
      const res = await fetch("/api/enterprise/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });

      const data = await res.json();
      if (data.success && data.policy) {
        const p: EnterprisePolicyConfig = data.policy;
        setPolicy(p);
        setLatencySlaCeilingMs(p.latencySlaCeilingMs);
        setMaxBudgetUsd(Math.round(p.budgetCap.maxBudgetPaise / 8000));
        setRequireApprovalUsd(Math.round(p.budgetCap.requireApprovalAbovePaise / 8000));
        setPrimaryJurisdiction(p.dataResidency.primaryJurisdiction);
        setEnforceSovereignty(p.dataResidency.enforceSovereignty);
        setAllowedJurisdictions(p.dataResidency.allowedJurisdictions);
        setProviderMode(p.providers.mode);
        setAllowedProviders(p.providers.allowedProviders);
        setForbiddenProviders(p.providers.forbiddenProviders);
        setRequireCheckpointMutation(p.humanInTheLoop.requireCheckpointOnStateMutation);
        setRequireCheckpointPayment(p.humanInTheLoop.requireCheckpointOnPaymentAbovePaise > 0);
        setRequireCheckpointPii(p.humanInTheLoop.requireCheckpointOnPiiExport);
        setRequireCheckpointWebhook(p.humanInTheLoop.requireCheckpointOnExternalWebhook);

        if (onPolicyUpdated) onPolicyUpdated(p);
        setSaveBanner("Policies restored to enterprise baseline defaults.");
        setTimeout(() => setSaveBanner(null), 4000);
      }
    } catch {
      setErrorBanner("Failed to reset policy defaults");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {saveBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Latency SLA Ceiling */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-cobalt-50 text-cobalt-600 border border-cobalt-200 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 font-sans">
                Latency SLA Ceiling
              </h3>
              <p className="text-xs text-slate-500">
                Reject autonomous agents with execution latency exceeding threshold.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700">
                Max Allowable Ceiling:
              </span>
              <span className="font-mono text-sm font-bold text-cobalt-600">
                {latencySlaCeilingMs.toLocaleString()}ms
              </span>
            </div>

            <input
              type="range"
              min={1000}
              max={10000}
              step={100}
              value={latencySlaCeilingMs}
              onChange={(e) => setLatencySlaCeilingMs(parseInt(e.target.value, 10))}
              className="w-full accent-cobalt-600 cursor-pointer"
            />

            {/* Presets */}
            <div className="flex items-center gap-2 pt-1">
              {[
                { label: "Tight (2,000ms)", val: 2000 },
                { label: "Standard (3,500ms)", val: 3500 },
                { label: "Relaxed (5,000ms)", val: 5000 },
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setLatencySlaCeilingMs(preset.val)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded border transition-colors ${
                    latencySlaCeilingMs === preset.val
                      ? "bg-cobalt-50 text-cobalt-700 border-cobalt-300 font-semibold"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Task Budget & Spend Controls */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-cobalt-50 text-cobalt-600 border border-cobalt-200 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 font-sans">
                Task Budget Caps &amp; Approval
              </h3>
              <p className="text-xs text-slate-500">
                Ceilings in USD and integer paise requiring managerial approval.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">
                Hard Budget Ceiling ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  value={maxBudgetUsd}
                  onChange={(e) => setMaxBudgetUsd(parseInt(e.target.value, 10) || 0)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-cobalt-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                ₹{(maxBudgetUsd * 80).toLocaleString()} ({(maxBudgetUsd * 8000).toLocaleString()} paise)
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 block">
                Manager Sign-off Threshold ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">$</span>
                <input
                  type="number"
                  min={25}
                  max={maxBudgetUsd}
                  value={requireApprovalUsd}
                  onChange={(e) => setRequireApprovalUsd(parseInt(e.target.value, 10) || 0)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-cobalt-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                ₹{(requireApprovalUsd * 80).toLocaleString()} ({(requireApprovalUsd * 8000).toLocaleString()} paise)
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Data Residency Sovereignty */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-cobalt-50 text-cobalt-600 border border-cobalt-200 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 font-sans">
                Data Residency Sovereignty
              </h3>
              <p className="text-xs text-slate-500">
                Enforce US, EU, or India processing rules across agent pipelines.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                Primary Jurisdiction
              </label>
              <select
                value={primaryJurisdiction}
                onChange={(e) => setPrimaryJurisdiction(e.target.value as Jurisdiction)}
                className="text-xs font-mono rounded-lg border border-slate-200 px-3 py-1.5 bg-white focus:outline-hidden focus:ring-1 focus:ring-cobalt-500"
              >
                <option value="US">US (United States)</option>
                <option value="EU">EU (European Union)</option>
                <option value="INDIA">INDIA (Sovereign)</option>
                <option value="GLOBAL">GLOBAL (Permissive)</option>
              </select>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-700 block mb-2">
                Allowed Processing Zones
              </span>
              <div className="flex items-center gap-2">
                {AVAILABLE_JURISDICTIONS.map((jur) => {
                  const isChecked = allowedJurisdictions.includes(jur);
                  return (
                    <button
                      key={jur}
                      type="button"
                      onClick={() => toggleJurisdiction(jur)}
                      className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                        isChecked
                          ? "bg-cobalt-50 text-cobalt-700 border-cobalt-300 font-semibold"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{jur}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={enforceSovereignty}
                onChange={(e) => setEnforceSovereignty(e.target.checked)}
                className="rounded-sm border-slate-300 text-cobalt-600 focus:ring-cobalt-500"
              />
              <span>Strict Sovereignty Containment (reject execution outside allowed zones)</span>
            </label>
          </div>
        </div>

        {/* Section 4: Provider Whitelist / Blacklist */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cobalt-50 text-cobalt-600 border border-cobalt-200 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 font-sans">
                  Provider Restrictions
                </h3>
                <p className="text-xs text-slate-500">
                  Control allowed and forbidden LLM models and endpoints.
                </p>
              </div>
            </div>

            <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setProviderMode("BLACKLIST")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  providerMode === "BLACKLIST"
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Blacklist
              </button>
              <button
                type="button"
                onClick={() => setProviderMode("WHITELIST")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  providerMode === "WHITELIST"
                    ? "bg-white text-slate-900 font-semibold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Whitelist
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <span className="text-xs font-medium text-slate-700 block">
              {providerMode === "BLACKLIST"
                ? "Restricted / Forbidden Providers (Click to toggle)"
                : "Approved Whitelist Providers (Click to toggle)"}
            </span>

            <div className="flex flex-wrap gap-2">
              {COMMON_PROVIDERS.map((prov) => {
                const isSelected =
                  providerMode === "BLACKLIST"
                    ? forbiddenProviders.includes(prov)
                    : allowedProviders.includes(prov);

                return (
                  <button
                    key={prov}
                    type="button"
                    onClick={() => toggleProvider(prov)}
                    className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                      isSelected
                        ? providerMode === "BLACKLIST"
                          ? "bg-rose-50 text-rose-700 border-rose-300 font-semibold"
                          : "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {prov}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Mandatory Human-in-the-Loop (HITL) Checkpoints */}
      <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-lg bg-cobalt-50 text-cobalt-600 border border-cobalt-200 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 font-sans">
              Mandatory Human-in-the-Loop (HITL) Triggers
            </h3>
            <p className="text-xs text-slate-500">
              Operations that automatically halt autonomous execution pending human review.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={requireCheckpointMutation}
              onChange={(e) => setRequireCheckpointMutation(e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-300 text-cobalt-600 focus:ring-cobalt-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">State Mutations</span>
              <span className="text-[11px] text-slate-500">
                Database writes, table drops, or inventory commits.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={requireCheckpointPayment}
              onChange={(e) => setRequireCheckpointPayment(e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-300 text-cobalt-600 focus:ring-cobalt-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">Payments &gt; $500</span>
              <span className="text-[11px] text-slate-500">
                Financial transfers exceeding ₹40,000 threshold.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={requireCheckpointPii}
              onChange={(e) => setRequireCheckpointPii(e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-300 text-cobalt-600 focus:ring-cobalt-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">PII Data Export</span>
              <span className="text-[11px] text-slate-500">
                Export of customer records or identity artifacts.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50 cursor-pointer text-xs text-slate-700">
            <input
              type="checkbox"
              checked={requireCheckpointWebhook}
              onChange={(e) => setRequireCheckpointWebhook(e.target.checked)}
              className="mt-0.5 rounded-sm border-slate-300 text-cobalt-600 focus:ring-cobalt-500"
            />
            <div>
              <span className="font-semibold text-slate-900 block">External Webhooks</span>
              <span className="text-[11px] text-slate-500">
                Egress calls to third-party unverified endpoints.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Save & Reset Controls */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <button
          type="button"
          disabled={isSaving}
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Defaults</span>
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white transition-colors shadow-xs disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save &amp; Enforce Policies</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
