"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  FileText,
  GitCompare,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Download,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  RefreshCw,
} from "lucide-react";
import {
  ReceivingExecutionResult,
  ReceivingPipelineStageRecord,
} from "@/lib/contracts/receiving-types";

interface ReceivingRunnerProps {
  isRunning: boolean;
  result: ReceivingExecutionResult | null;
  activeStageIndex: number;
  onDownloadReceipt: () => void;
}

export function ReceivingRunner({
  isRunning,
  result,
  activeStageIndex,
  onDownloadReceipt,
}: ReceivingRunnerProps) {
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const runnerContainerRef = useRef<HTMLDivElement>(null);

  const stagesMeta = [
    {
      id: "EVIDENCE_READER",
      title: "Evidence Reader",
      version: "v1.0.0",
      builder: "builder-jordan-lee",
      description: "Extracts line items, vendor identifiers, and physical scan logs from document bundle.",
      icon: FileText,
    },
    {
      id: "RECONCILIATION_SPECIALIST",
      title: "Reconciliation Specialist",
      version: "v1.1.0",
      builder: "builder-jordan-lee",
      description: "Performs 3-way matching across PO, packing slip, and inspection log with 2.0% tolerance check.",
      icon: GitCompare,
    },
    {
      id: "EXCEPTION_REPORTER",
      title: "Exception Reporter",
      version: "v1.0.0",
      builder: "builder-jordan-lee",
      description: "Compiles discrepancies, calculates financial exposure, and drafts auditable credit memo.",
      icon: AlertOctagon,
    },
  ];

  // GSAP animation for progress bar
  useEffect(() => {
    if (progressBarRef.current) {
      let targetProgress = 0;
      if (isRunning) {
        targetProgress = Math.max(15, ((activeStageIndex + 1) / 3) * 90);
      } else if (result) {
        targetProgress = 100;
      }
      gsap.to(progressBarRef.current, {
        width: `${targetProgress}%`,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, [isRunning, activeStageIndex, result]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getStageStatus = (index: number) => {
    if (!isRunning && !result) return "IDLE";
    if (result) return "COMPLETED";
    if (index < activeStageIndex) return "COMPLETED";
    if (index === activeStageIndex) return "RUNNING";
    return "QUEUED";
  };

  return (
    <div
      ref={runnerContainerRef}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-px bg-slate-200"
    >
      {/* Top Banner / Execution Telemetry Header */}
      <div className="bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cobalt-600 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Multi-Agent Inbound Pipeline Runner
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cobalt-50 text-cobalt-800 border border-cobalt-200 font-semibold">
                Autonomous Direct Execution
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Deterministic Stage Orchestration with Cryptographic SHA-256 Audit Trail
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-600">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {result ? `${result.totalDurationMs}ms total` : isRunning ? "Executing..." : "Ready"}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>3 Specialist Agents</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            ref={progressBarRef}
            className="h-full bg-cobalt-600 rounded-full transition-all"
            style={{ width: "0%" }}
          />
        </div>
      </div>

      {/* 3 Pipeline Stages List */}
      <div className="bg-white divide-y divide-slate-100">
        {stagesMeta.map((stage, idx) => {
          const status = getStageStatus(idx);
          const isCompleted = status === "COMPLETED";
          const isCurrent = status === "RUNNING";
          const stageRecord: ReceivingPipelineStageRecord | undefined = result?.sealedReceipt.stages[idx];
          const isExpanded = expandedStage === idx;
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`p-4 transition-colors ${
                isCurrent ? "bg-cobalt-50/30" : isCompleted ? "bg-white" : "bg-porcelain-50/50"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : isCurrent
                        ? "bg-cobalt-100 text-cobalt-700 border border-cobalt-300 animate-pulse"
                        : "bg-slate-100 text-slate-400 border border-slate-200"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-cobalt-600" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {stage.title}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {stage.version}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                        {stage.builder}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {stageRecord?.summary || stage.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {stageRecord && (
                    <div className="text-right font-mono text-[11px] hidden sm:block">
                      <div className="text-slate-900 font-semibold">{stageRecord.latencyMs}ms</div>
                      <div className="text-[10px] text-slate-400">
                        {stageRecord.sha256Digest.slice(0, 10)}...
                      </div>
                    </div>
                  )}

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isCompleted
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : isCurrent
                        ? "bg-cobalt-50 text-cobalt-800 border border-cobalt-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {status}
                  </span>

                  {result && (
                    <button
                      type="button"
                      onClick={() => setExpandedStage(isExpanded ? null : idx)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      aria-label="Toggle stage details"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Inspection Drawer */}
              {isExpanded && result && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-600 space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Stage Digest (SHA-256):</span>
                    <span className="text-[10px] text-cobalt-700">
                      {stageRecord?.sha256Digest}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">
                      Structured Stage Output:
                    </span>
                    <pre className="p-2 rounded bg-slate-900 text-slate-100 overflow-x-auto text-[10px] max-h-40">
                      {JSON.stringify(
                        idx === 0
                          ? result.extractedDocuments
                          : idx === 1
                          ? result.reconciliation
                          : result.exceptionReport,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sealed Evidence Receipt Card (When Complete) */}
      {result && (
        <div className="bg-porcelain-50 p-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-cobalt-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    Receipt: {result.sealedReceipt.receiptId}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold uppercase">
                    SHA-256 Sealed
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                  <span>Hash: {result.sealedReceipt.sha256Hash.slice(0, 32)}...</span>
                  <button
                    type="button"
                    onClick={() => handleCopyHash(result.sealedReceipt.sha256Hash)}
                    className="hover:text-slate-800 transition-colors"
                    title="Copy full SHA-256 hash"
                  >
                    {copiedHash ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onDownloadReceipt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold font-mono transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-cobalt-600" />
              <span>Download Evidence Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
