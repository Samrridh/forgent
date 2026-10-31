"use client";

import React, { useState } from "react";
import { GatewayPolicyConfig } from "@/lib/contracts/gateway-types";
import {
  Lock,
  Globe,
  Database,
  CheckCircle2,
  RotateCcw,
  Save,
} from "lucide-react";

interface PolicyControlsProps {
  policy: GatewayPolicyConfig;
  onPolicyUpdated: (updated: GatewayPolicyConfig) => void;
}

export function PolicyControls({ policy, onPolicyUpdated }: PolicyControlsProps) {
  const [zeroTrustPiiMasking, setZeroTrustPiiMasking] = useState(
    policy.zeroTrustPiiMasking
  );
  const [networkEgressContainment, setNetworkEgressContainment] = useState(
    policy.networkEgressContainment
  );
  const [consequentialStateMutationLock, setConsequentialStateMutationLock] =
    useState(policy.consequentialStateMutationLock);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  const handleSavePolicy = async () => {
    setIsSaving(true);
    setSaveBanner(null);

    try {
      const response = await fetch("/api/gateway/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zeroTrustPiiMasking,
          networkEgressContainment,
          consequentialStateMutationLock,
        }),
      });

      const data = await response.json();
      if (data.success && data.policy) {
        onPolicyUpdated(data.policy);
        setSaveBanner("Enterprise tool gateway policies updated and enforced across all active agents.");
        setTimeout(() => setSaveBanner(null), 4000);
      }
    } catch {
      setSaveBanner("Failed to synchronize policy updates with gateway engine.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToBaseline = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/gateway/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const data = await response.json();
      if (data.success && data.policy) {
        setZeroTrustPiiMasking(data.policy.zeroTrustPiiMasking);
        setNetworkEgressContainment(data.policy.networkEgressContainment);
        setConsequentialStateMutationLock(data.policy.consequentialStateMutationLock);
        onPolicyUpdated(data.policy);
        setSaveBanner("Gateway policies reset to enterprise baseline defaults.");
        setTimeout(() => setSaveBanner(null), 4000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {saveBanner && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Policy Guard Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Guard 1: Zero-Trust PII Masking */}
        <div className="p-5 rounded-xl border border-border-default bg-surface-primary flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-cobalt-50 text-cobalt-600 flex items-center justify-center border border-cobalt-200">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Zero-Trust PII &amp; Secret Masking
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Wire-speed sanitization scans all outbound tool inputs for API keys, bearer tokens, passwords, credit cards, emails, and SSNs.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-700">
              {zeroTrustPiiMasking ? "ENFORCED" : "BYPASSED"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={zeroTrustPiiMasking}
                onChange={(e) => setZeroTrustPiiMasking(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cobalt-600"></div>
            </label>
          </div>
        </div>

        {/* Guard 2: Network Egress Containment */}
        <div className="p-5 rounded-xl border border-border-default bg-surface-primary flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Network Egress Containment
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Isolates agent execution to authorized internal enterprise domains. Prohibits egress to arbitrary IP addresses or unverified webhook endpoints.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-700">
              {networkEgressContainment ? "CONTAINED" : "UNRESTRICTED"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={networkEgressContainment}
                onChange={(e) => setNetworkEgressContainment(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        {/* Guard 3: Consequential State Mutation Lock */}
        <div className="p-5 rounded-xl border border-border-default bg-surface-primary flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Consequential State Mutation Lock
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Restricts destructive or irreversible operations (e.g. inventory decrements, database truncate, shell execution) unless dual-authorized.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-700">
              {consequentialStateMutationLock ? "LOCKED" : "UNLOCKED"}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={consequentialStateMutationLock}
                onChange={(e) => setConsequentialStateMutationLock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Allowed Domain & Blocked Operation Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl border border-border-default bg-surface-primary space-y-3">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Approved Egress Domains
          </h4>
          <p className="text-xs text-slate-500">
            Agents invoking external network webhooks are constrained to these hostnames:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {policy.allowedEgressDomains.map((domain) => (
              <span
                key={domain}
                className="px-2.5 py-1 rounded text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl border border-border-default bg-surface-primary space-y-3">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Prohibited Operations
          </h4>
          <p className="text-xs text-slate-500">
            These operations are unconditionally blocked regardless of agent identity:
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {policy.blockedOperations.map((op) => (
              <span
                key={op}
                className="px-2.5 py-1 rounded text-xs font-mono bg-rose-50 text-rose-700 border border-rose-200"
              >
                {op}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Save / Reset Controls Footer */}
      <div className="p-4 rounded-xl border border-border-default bg-surface-primary flex items-center justify-between">
        <button
          type="button"
          onClick={handleResetToBaseline}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default Policy</span>
        </button>

        <button
          type="button"
          onClick={handleSavePolicy}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Enforcing Policy..." : "Save & Enforce Policies"}</span>
        </button>
      </div>
    </div>
  );
}
