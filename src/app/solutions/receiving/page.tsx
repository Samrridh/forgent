"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import {
  ReceivingExecutionResult,
  CheckpointResolution,
} from "@/lib/contracts/receiving-types";
import { RECEIVING_SCENARIOS } from "@/server/solutions/receiving-scenarios";
import { ReceivingRunner } from "@/components/solutions/receiving-runner";
import { ReceivingDiffViewer } from "@/components/solutions/receiving-diff-viewer";
import { ReceivingDocumentTabs } from "@/components/solutions/receiving-document-tabs";
import { ReceivingCheckpointModal } from "@/components/solutions/receiving-checkpoint-modal";

export default function ReceivingSolutionPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    RECEIVING_SCENARIOS[0].id
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [executionResult, setExecutionResult] =
    useState<ReceivingExecutionResult | null>(null);
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeScenario =
    RECEIVING_SCENARIOS.find((s) => s.id === selectedScenarioId) ||
    RECEIVING_SCENARIOS[0];

  // Reset state when scenario changes
  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    setExecutionResult(null);
    setError(null);
    setActiveStageIndex(0);
    setIsRunning(false);
  };

  const handleRunPipeline = async () => {
    setIsRunning(true);
    setError(null);
    setActiveStageIndex(0);

    try {
      const response = await fetch("/api/solutions/receiving/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: activeScenario.id,
          documents: activeScenario.documents,
          erpBaseline: activeScenario.erpBaseline,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Pipeline execution failed with HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const eventMatch = line.match(/^event: (.+)$/m);
            const dataMatch = line.match(/^data: (.+)$/m);

            if (eventMatch && dataMatch) {
              const eventName = eventMatch[1].trim();
              const eventData = JSON.parse(dataMatch[1].trim());

              if (eventName === "stage-start") {
                if (eventData.stage === "EVIDENCE_READER") setActiveStageIndex(0);
                if (eventData.stage === "RECONCILIATION_SPECIALIST") setActiveStageIndex(1);
                if (eventData.stage === "EXCEPTION_REPORTER") setActiveStageIndex(2);
              } else if (eventName === "pipeline-complete") {
                setExecutionResult(eventData.result);
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      console.error("Execution error", err);
      // Fallback to synchronous run if SSE stream parsing encountered network interruption
      try {
        const syncRes = await fetch("/api/solutions/receiving/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: activeScenario.id,
            documents: activeScenario.documents,
            erpBaseline: activeScenario.erpBaseline,
            stream: false,
          }),
        });
        const syncJson = await syncRes.json();
        if (syncJson.success) {
          setExecutionResult(syncJson.result);
        } else {
          setError(syncJson.error || "Execution failed");
        }
      } catch (syncErr: unknown) {
        setError(syncErr instanceof Error ? syncErr.message : "Pipeline execution failed");
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleResolveCheckpoint = async (resolution: CheckpointResolution) => {
    if (!executionResult || !executionResult.checkpoint) return;

    try {
      const response = await fetch("/api/solutions/receiving/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: activeScenario.id,
          documents: executionResult.extractedDocuments,
          erpBaseline: activeScenario.erpBaseline,
          resolution,
          stream: false,
        }),
      });

      const json = await response.json();
      if (json.success) {
        setExecutionResult(json.result);
        setIsCheckpointModalOpen(false);
      } else {
        alert(json.error || "Failed to resolve checkpoint");
      }
    } catch (err) {
      console.error("Resolution error", err);
      alert("Failed to submit checkpoint resolution");
    }
  };

  const handleDownloadReceipt = () => {
    if (!executionResult) return;
    const blob = new Blob(
      [JSON.stringify(executionResult.sealedReceipt, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${executionResult.sealedReceipt.receiptId}-evidence-receipt.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-porcelain-100/40 pb-20">
      {/* Navigation Breadcrumb & Header */}
      <div className="border-b border-slate-200 bg-white sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition-colors">
              Forgent
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href="/buyer/overview" className="hover:text-slate-900 transition-colors">
              Solutions
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="font-bold text-cobalt-700">Receiving Reconciliation</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cobalt-50 text-cobalt-800 border border-cobalt-200 font-bold uppercase">
              Northstar Market Wedge
            </span>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
              <Building2 className="w-3.5 h-3.5 text-cobalt-600" />
              <span>Northstar Logistics Enterprise</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Hero Banner */}
        <div className="relative rounded-3xl bg-linear-to-b from-white via-white to-porcelain-50 border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cobalt-50 text-cobalt-800 border border-cobalt-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-cobalt-600" />
              <span>Autonomous Inbound Supply Chain Verification</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
              Autonomous Receiving & Inventory Reconciliation
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Eliminate inventory drift and fraudulent vendor over-billing. Forgent orchestrates independent specialist agents to perform 3-way matching across purchase orders, packing slips, and dock receiving inspection logs, verifies quantity tolerances, and seals cryptographic evidence receipts before ERP commitment.
            </p>
          </div>
        </div>

        {/* Scenario Selector & Controls Bar */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Curated Industry Benchmark Scenarios
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a controlled scenario fixture to execute through the autonomous pipeline.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleScenarioChange(selectedScenarioId)}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold font-mono transition-colors shadow-xs disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>

              <button
                type="button"
                onClick={handleRunPipeline}
                disabled={isRunning}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-bold font-mono transition-all shadow-sm hover:shadow-md disabled:opacity-60"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isRunning ? "Running Multi-Agent Pipeline..." : "Execute 3-Way Match Pipeline"}</span>
              </button>
            </div>
          </div>

          {/* Scenario Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {RECEIVING_SCENARIOS.map((scenario) => {
              const isSelected = scenario.id === selectedScenarioId;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleScenarioChange(scenario.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-cobalt-600 bg-white shadow-sm ring-1 ring-cobalt-600"
                      : "border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                      {scenario.industry}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        scenario.badge === "Clean Match"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : scenario.badge === "Variance Escalation"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                      }`}
                    >
                      {scenario.badge}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug">
                    {scenario.name}
                  </h3>

                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {scenario.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Scenario Brief Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Expected Outcome Criteria
            </span>
            <p className="text-slate-800 font-sans font-medium">
              {activeScenario.expectedOutcome}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500">SKU Category:</span>
            <span className="font-bold text-slate-900 px-2 py-1 rounded bg-porcelain-100 border border-slate-200">
              {activeScenario.skuCategory}
            </span>
          </div>
        </div>

        {/* Inbound Document Bundle Inspector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Inbound Evidence Bundle
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              3 Primary Source Documents
            </span>
          </div>

          <ReceivingDocumentTabs documents={activeScenario.documents} />
        </div>

        {/* Pipeline Runner Container */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Multi-Agent Orchestration & Live Telemetry
            </h3>
            {executionResult && (
              <span className="text-xs text-emerald-700 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Execution Verified</span>
              </span>
            )}
          </div>

          <ReceivingRunner
            isRunning={isRunning}
            result={executionResult}
            activeStageIndex={activeStageIndex}
            onDownloadReceipt={handleDownloadReceipt}
          />
        </div>

        {/* Human Checkpoint Alert Banner (If Checkpoint Emitted) */}
        {executionResult?.checkpoint && executionResult.checkpoint.status === "PENDING" && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3 max-w-2xl">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Human Checkpoint Escalation Required
                  </h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold">
                    Policy Hold
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {executionResult.checkpoint.reason} Automated inventory increment is halted until reviewed and signed off by an authorized manager.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCheckpointModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Review & Authorize Override
            </button>
          </div>
        )}

        {/* Before/After ERP Inventory State Diff Table */}
        {executionResult && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                ERP Inventory State Reconciliation
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Ledger Delta Table
              </span>
            </div>

            <ReceivingDiffViewer
              diff={executionResult.erpStateDiff}
              reconciliation={executionResult.reconciliation}
              onOpenCheckpointModal={() => setIsCheckpointModalOpen(true)}
            />
          </div>
        )}

        {/* Exception Report & Recommended Credit Memo */}
        {executionResult && executionResult.exceptionReport.totalExceptions > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Itemized Exceptions & Credit Memo Draft
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Report ID: {executionResult.exceptionReport.reportId}
                </p>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block uppercase">
                  Total Debit Claim
                </span>
                <span className="text-sm font-bold text-amber-800">
                  ₹{(executionResult.exceptionReport.totalCreditMemoRecommendedPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {executionResult.exceptionReport.items.map((item) => (
                <div
                  key={item.exceptionId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-porcelain-50/70 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                      ₹{(item.recommendedCreditMemoPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 font-mono text-[10px] text-slate-500">
                    Citations: {item.evidence.map((e) => e.sourceDocument).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs">
            {error}
          </div>
        )}
      </main>

      {/* Interactive Checkpoint Modal */}
      {executionResult?.checkpoint && (
        <ReceivingCheckpointModal
          isOpen={isCheckpointModalOpen}
          checkpoint={executionResult.checkpoint}
          onResolve={handleResolveCheckpoint}
          onClose={() => setIsCheckpointModalOpen(false)}
        />
      )}
    </div>
  );
}
