"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  EnterprisePipeline,
  DepartmentBudget,
  AuditLedgerEntry,
} from "@/lib/contracts/enterprise-types";
import {
  INITIAL_ENTERPRISE_PIPELINES,
  INITIAL_DEPARTMENT_BUDGETS,
  INITIAL_AUDIT_LOGS,
} from "@/data/enterprise-data";
import { PipelineBuilderTab } from "./pipeline-builder-tab";
import { TestFlightTab } from "./test-flight-tab";
import { AuditLedgerTab } from "./audit-ledger-tab";
import { ToolGatewayConsole } from "./tool-gateway-console";
import { CustomWorkflowModal } from "./custom-workflow-modal";
import { useCurrency } from "@/context/currency-context";
import {
  GitFork,
  Activity,
  FileSpreadsheet,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
  Sliders,
} from "lucide-react";

export type EnterpriseTab =
  | "orchestration"
  | "test-flight"
  | "ledger"
  | "security-gateway";

interface EnterprisePortalProps {
  initialTab?: EnterpriseTab;
}

export function EnterprisePortal({
  initialTab = "orchestration",
}: EnterprisePortalProps) {
  const { formattedWalletBalance } = useCurrency();
  const [activeTab, setActiveTab] = useState<EnterpriseTab>(initialTab);
  const [pipelines, setPipelines] = useState<EnterprisePipeline[]>(
    INITIAL_ENTERPRISE_PIPELINES
  );
  const [activePipelineId, setActivePipelineId] = useState<string>(
    INITIAL_ENTERPRISE_PIPELINES[0].id
  );
  const [budgets] = useState<DepartmentBudget[]>(
    INITIAL_DEPARTMENT_BUDGETS
  );
  const [auditLogs, setAuditLogs] = useState<AuditLedgerEntry[]>(
    INITIAL_AUDIT_LOGS
  );
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const activePipeline =
    pipelines.find((p) => p.id === activePipelineId) || pipelines[0];

  const handleUpdatePipeline = (updated: EnterprisePipeline) => {
    setPipelines((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  };

  const handleWorkflowGenerated = (newPipeline: EnterprisePipeline) => {
    setPipelines((prev) => [newPipeline, ...prev]);
    setActivePipelineId(newPipeline.id);
    setActiveTab("orchestration");
    setSuccessBanner(
      `Synthesized custom 3-stage DAG for "${newPipeline.name}". Parameter pipes mapped.`
    );
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  const handleDeployPipeline = (pipelineId: string) => {
    const target = pipelines.find((p) => p.id === pipelineId);
    if (!target) return;

    // Update pipeline status
    const updated: EnterprisePipeline = {
      ...target,
      deploymentStatus: "DEPLOYED_ORG",
      lastTestedAt: new Date().toISOString(),
    };
    handleUpdatePipeline(updated);

    // Record deployment in Audit Ledger
    const newAuditEntry: AuditLedgerEntry = {
      id: `audit-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      executor: "Maya Rao (Buyer)",
      department: `${target.category} Operations`,
      pipelineId: target.id,
      pipelineName: target.name,
      escrowDebitedPaise: target.totalCostPaise,
      status: "COMMITTED",
      verificationHash:
        target.certificationSeal || `PH-DEPLOY-${Date.now().toString(16)}`,
      durationMs: target.estimatedLatencyMs,
      stageResultsSummary: `Deployed pipeline "${target.name}" to enterprise organization with 3 verified stages.`,
    };
    setAuditLogs((prev) => [newAuditEntry, ...prev]);

    setSuccessBanner(
      `Pipeline "${target.name}" deployed to organization. Cryptographic deployment logged in audit ledger.`
    );
    setTimeout(() => setSuccessBanner(null), 5000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner / Hero Header */}
      <section className="border-b border-border-default bg-surface-primary py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Breadcrumb Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-200">
              Enterprise Hub
            </span>
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Organization: Acme Global Logistics
            </span>
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Agent DAG Engine Live</span>
            </span>
          </div>

          {/* Heading & Subcopy */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Enterprise Workflow Hub
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Construct multi-agent DAG pipelines, run 3-stage synthetic test flights against strict SLAs, and inspect cryptographic departmental spend ledgers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right font-mono">
                <span className="text-[10px] text-slate-400 uppercase">
                  Org Escrow Balance
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {formattedWalletBalance}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Custom Workflow</span>
              </button>
            </div>
          </div>

          {/* Success Alert Banner */}
          {successBanner && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="pt-2 flex items-center gap-2 border-b border-slate-200 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("orchestration")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "orchestration"
                  ? "border-cobalt-500 text-cobalt-700 bg-cobalt-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <GitFork className="w-4 h-4" />
              <span>1. Pipeline Orchestration</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("test-flight")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "test-flight"
                  ? "border-cobalt-500 text-cobalt-700 bg-cobalt-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>2. Synthetic Test Flight Engine</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "ledger"
                  ? "border-cobalt-500 text-cobalt-700 bg-cobalt-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>3. Departmental Spend &amp; Audit Ledger</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security-gateway")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "security-gateway"
                  ? "border-cobalt-500 text-cobalt-700 bg-cobalt-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>4. Tool Gateway &amp; Security</span>
            </button>

            <Link
              href="/enterprise/policies"
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors whitespace-nowrap"
            >
              <Sliders className="w-4 h-4 text-cobalt-600" />
              <span>5. Compliance &amp; SLA Policies</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Tab Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "orchestration" && (
          <PipelineBuilderTab
            pipeline={activePipeline}
            onUpdatePipeline={handleUpdatePipeline}
            onOpenGeneratorModal={() => setIsGeneratorOpen(true)}
            onNavigateToTestFlight={() => setActiveTab("test-flight")}
            allPipelines={pipelines}
            onSelectPipeline={(id) => setActivePipelineId(id)}
          />
        )}

        {activeTab === "test-flight" && (
          <TestFlightTab
            pipeline={activePipeline}
            onDeployPipeline={handleDeployPipeline}
            onUpdatePipeline={handleUpdatePipeline}
          />
        )}

        {activeTab === "ledger" && (
          <AuditLedgerTab budgets={budgets} auditLogs={auditLogs} />
        )}

        {activeTab === "security-gateway" && <ToolGatewayConsole />}
      </main>

      {/* Custom Workflow Generator Modal */}
      <CustomWorkflowModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onWorkflowGenerated={handleWorkflowGenerated}
      />
    </div>
  );
}
