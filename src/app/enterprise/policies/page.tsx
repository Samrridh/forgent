"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  EnterprisePolicyConfig,
  ComplianceAuditRecord,
  ComplianceCertificate,
} from "@/lib/contracts/compliance-types";
import { DEFAULT_ENTERPRISE_POLICY } from "@/server/compliance/compliance-seed";
import { PolicyRulesEditor } from "@/components/enterprise/policy-rules-editor";
import { PolicyVerdictCard } from "@/components/enterprise/policy-verdict-card";
import { ComplianceCertificateModal } from "@/components/enterprise/compliance-certificate-modal";
import {
  ShieldCheck,
  Clock,
  Coins,
  Globe,
  Cpu,
  Lock,
  Sliders,
  Play,
  FileSpreadsheet,
  FileCheck2,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

type PolicyTab = "editor" | "evaluator" | "audit";

export default function EnterprisePoliciesPage() {
  const [activeTab, setActiveTab] = useState<PolicyTab>("editor");
  const [policy, setPolicy] = useState<EnterprisePolicyConfig>(
    DEFAULT_ENTERPRISE_POLICY
  );
  const [auditLogs, setAuditLogs] = useState<ComplianceAuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState<ComplianceCertificate | null>(
    null
  );
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [policyRes, auditRes] = await Promise.all([
          fetch("/api/enterprise/policies"),
          fetch("/api/enterprise/policies/audit"),
        ]);

        const policyData = await policyRes.json();
        if (policyData.success && policyData.policy) {
          setPolicy(policyData.policy);
        }

        const auditData = await auditRes.json();
        if (auditData.success && auditData.auditLogs) {
          setAuditLogs(auditData.auditLogs);
        }
      } catch {
        // Fallback to default in-memory states
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleOpenCertificate = (cert: ComplianceCertificate) => {
    setSelectedCert(cert);
    setIsCertModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Banner / Hero Header */}
      <section className="border-b border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 shadow-2xs">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumb Navigation */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/enterprise"
              className="flex items-center gap-1 font-mono text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Enterprise Hub</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-mono uppercase px-2 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-200 font-semibold">
              Compliance &amp; Governance
            </span>
            <span className="font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Acme Global Logistics
            </span>
            <span className="font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active Policy v{policy.version}</span>
            </span>
          </div>

          {/* Heading */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Enterprise Policy Guardrails &amp; SLAs
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Configure latency ceilings, budget thresholds, sovereign data residency, and provider blacklists for autonomous agent execution.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/settings/compliance"
                className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
              >
                Settings Overview
              </Link>
              <Link
                href="/enterprise"
                className="px-3.5 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Workflow Hub
              </Link>
            </div>
          </div>

          {/* Summary Metric Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono uppercase">
                <Clock className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Latency SLA</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-1">
                {policy.latencySlaCeilingMs}ms
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono uppercase">
                <Coins className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Budget Cap</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-1">
                ₹{(policy.budgetCap.maxBudgetPaise / 100).toLocaleString()}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono uppercase">
                <Globe className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Sovereignty</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-1">
                {policy.dataResidency.allowedJurisdictions.join(", ")}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono uppercase">
                <Cpu className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Providers</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-1">
                {policy.providers.mode === "BLACKLIST"
                  ? `${policy.providers.forbiddenProviders.length} Restricted`
                  : `${policy.providers.allowedProviders.length} Whitelisted`}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono uppercase">
                <Lock className="w-3.5 h-3.5 text-cobalt-600" />
                <span>HITL Triggers</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-1">
                4 Active Guards
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="pt-2 flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "editor"
                  ? "border-cobalt-600 text-cobalt-700 bg-cobalt-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>1. Policy Guardrails Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("evaluator")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "evaluator"
                  ? "border-cobalt-600 text-cobalt-700 bg-cobalt-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Play className="w-4 h-4" />
              <span>2. Real-Time Workflow Evaluator</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("audit")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "audit"
                  ? "border-cobalt-600 text-cobalt-700 bg-cobalt-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>3. Compliance Audit Ledger &amp; Certificates</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center p-12 text-slate-500 gap-2">
            <RotateCcw className="w-5 h-5 animate-spin text-cobalt-600" />
            <span className="text-sm">Synchronizing policy state...</span>
          </div>
        ) : (
          <>
            {activeTab === "editor" && (
              <PolicyRulesEditor
                initialPolicy={policy}
                onPolicyUpdated={(p) => setPolicy(p)}
              />
            )}

            {activeTab === "evaluator" && <PolicyVerdictCard />}

            {activeTab === "audit" && (
              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Enterprise Compliance Audit Ledger
                      </h3>
                      <p className="text-xs text-slate-500">
                        Cryptographic record of all evaluated candidate workflows and signed certificates.
                      </p>
                    </div>
                    <span className="font-mono text-xs text-slate-500">
                      {auditLogs.length} Records Logged
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-mono uppercase text-[10px]">
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Workflow</th>
                          <th className="py-2.5 px-3">Verdict</th>
                          <th className="py-2.5 px-3">Score</th>
                          <th className="py-2.5 px-3">Latency</th>
                          <th className="py-2.5 px-3">Cost</th>
                          <th className="py-2.5 px-3">Jurisdiction</th>
                          <th className="py-2.5 px-3 text-right">Certificate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                              })}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-900">
                              {log.workflowName}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded font-semibold ${
                                  log.verdict === "PASSED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : log.verdict === "CHECKPOINT_REQUIRED"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {log.verdict}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-900">
                              {log.score}/100
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600">
                              {log.latencyMs.toLocaleString()}ms
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600">
                              ₹{(log.costPaise / 100).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-600">
                              {log.jurisdiction}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {log.certificate ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCertificate(log.certificate!)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-cobalt-600 hover:text-cobalt-700 font-mono"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  <span>{log.certificate.id.slice(0, 10)}</span>
                                </button>
                              ) : (
                                <span className="font-mono text-[11px] text-slate-400">
                                  Blocked
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Compliance Certificate Modal */}
      <ComplianceCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        certificate={selectedCert}
      />
    </div>
  );
}
