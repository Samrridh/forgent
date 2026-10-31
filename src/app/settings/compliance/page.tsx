"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  EnterprisePolicyConfig,
} from "@/lib/contracts/compliance-types";
import { DEFAULT_ENTERPRISE_POLICY } from "@/server/compliance/compliance-seed";
import { PolicyRulesEditor } from "@/components/enterprise/policy-rules-editor";
import {
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

export default function SettingsCompliancePage() {
  const [policy, setPolicy] = useState<EnterprisePolicyConfig>(
    DEFAULT_ENTERPRISE_POLICY
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPolicy() {
      try {
        const res = await fetch("/api/enterprise/policies");
        const data = await res.json();
        if (data.success && data.policy) {
          setPolicy(data.policy);
        }
      } catch {
        // Fallback to default
      } finally {
        setIsLoading(false);
      }
    }
    loadPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Enterprise Settings
            </span>
            <span className="text-slate-300">/</span>
            <span className="font-mono uppercase px-2.5 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-200 font-semibold">
              Compliance &amp; SLA Guardrails
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Organization Compliance Settings
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Global governance policies applied to all autonomous agent deployments, multi-agent DAG pipelines, and synthetic test flights.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/enterprise/policies"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Enterprise Policy Command Center</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Settings Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
            <RotateCcw className="w-5 h-5 animate-spin text-cobalt-600" />
            <span className="text-sm">Loading compliance settings...</span>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-cobalt-50/60 border border-cobalt-200 text-xs text-cobalt-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cobalt-600 shrink-0" />
                <span>
                  Policy version <strong>{policy.version}</strong> is actively enforced across Acme Global Logistics organization runners.
                </span>
              </div>
              <Link
                href="/enterprise/policies"
                className="font-semibold text-cobalt-700 hover:text-cobalt-800 underline flex items-center gap-1"
              >
                <span>Live Evaluator</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <PolicyRulesEditor
              initialPolicy={policy}
              onPolicyUpdated={(p) => setPolicy(p)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
