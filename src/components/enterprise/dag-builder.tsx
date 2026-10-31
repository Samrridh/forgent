"use client";

import React, { useState } from "react";
import {
  EnterprisePipeline,
} from "@/lib/contracts/enterprise-types";
import { useCurrency } from "@/context/currency-context";
import { LivePipelineRunner } from "./live-pipeline-runner";
import {
  Wand2,
  Sparkles,
  Play,
  Clock,
  Coins,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GitFork,
  ChevronRight,
  Layers,
  ArrowRight,
  Database,
  Cpu,
  FileCheck2,
} from "lucide-react";

interface DagBuilderProps {
  pipeline: EnterprisePipeline;
  onUpdatePipeline: (updated: EnterprisePipeline) => void;
  onSelectPipeline?: (id: string) => void;
  allPipelines?: EnterprisePipeline[];
  selectedNodeId?: string;
  onSelectNode?: (nodeId: string) => void;
}

const PRESET_SHORTCUTS = [
  {
    label: "Market & Financial Analysis",
    prompt:
      "Conduct a thorough market competitor analysis and draft an executive financial summary",
    category: "Finance",
  },
  {
    label: "HIPAA & Contract Risk",
    prompt:
      "Parse vendor healthcare contracts, verify HIPAA BAA compliance rules, and export risk report",
    category: "Legal",
  },
  {
    label: "Cloud FinOps Reconciler",
    prompt:
      "Ingest multi-cloud AWS/GCP telemetry, cross-reference invoice line-items, and compute RI cost savings",
    category: "DevOps",
  },
];

export function DagBuilder({
  pipeline,
  onUpdatePipeline,
  onSelectPipeline,
  allPipelines,
  selectedNodeId,
  onSelectNode,
}: DagBuilderProps) {
  const { formatPrice, currency } = useCurrency();
  const [prompt, setPrompt] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilerBanner, setCompilerBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isRunnerOpen, setIsRunnerOpen] = useState(false);
  const [runningNodeId, setRunningNodeId] = useState<string | null>(null);

  const formatCost = (costPaise: number) => {
    const usd = costPaise / 8000;
    return formatPrice(usd);
  };

  const handleDecomposeAndAssemble = async (targetPrompt?: string, category?: string) => {
    const query = (targetPrompt || prompt).trim();
    if (!query) return;

    setIsCompiling(true);
    setCompilerBanner(null);
    setErrorBanner(null);

    try {
      const res = await fetch("/api/compiler/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query, category }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Decomposition failed with HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.pipeline) {
        onUpdatePipeline(data.pipeline);
        if (onSelectPipeline) {
          onSelectPipeline(data.pipeline.id);
        }
        setCompilerBanner(
          `AI Auto-Assembled "${data.pipeline.name}" with ${data.pipeline.nodes.length} specialized agents. Parameter pipes connected.`
        );
        setTimeout(() => setCompilerBanner(null), 6000);
      }
    } catch (err: unknown) {
      setErrorBanner(err instanceof Error ? err.message : "Compilation decomposition failure");
      setTimeout(() => setErrorBanner(null), 6000);
    } finally {
      setIsCompiling(false);
    }
  };

  const getNodeIcon = (stage: string) => {
    if (stage === "INGESTION") return Database;
    if (stage === "PROCESSING") return Cpu;
    return FileCheck2;
  };

  return (
    <div className="space-y-6">
      {/* 1. AI Auto-Assemble Top Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cobalt-50 text-cobalt-600 border border-cobalt-200 flex items-center justify-center">
              <Wand2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Autonomous Team Compiler v2
              </span>
              <p className="text-[11px] text-slate-500">
                Natural language goal decomposition &amp; interactive live DAG canvas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {allPipelines && onSelectPipeline && (
              <select
                value={pipeline.id}
                onChange={(e) => onSelectPipeline(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-cobalt-500"
              >
                {allPipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setIsRunnerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run Pipeline</span>
            </button>
          </div>
        </div>

        {/* Input bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCompiling) {
                  handleDecomposeAndAssemble();
                }
              }}
              placeholder="Describe your desired workflow outcome in plain English..."
              className="w-full pl-3 pr-10 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-cobalt-500 text-slate-900 placeholder-slate-400 bg-porcelain-50"
            />
          </div>

          <button
            type="button"
            disabled={isCompiling || !prompt.trim()}
            onClick={() => handleDecomposeAndAssemble()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors shrink-0"
          >
            {isCompiling ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Decomposing Goal...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-azure-400" />
                <span>Auto-Assemble DAG</span>
              </>
            )}
          </button>
        </div>

        {/* 3 Pre-filled Shortcuts for Non-Technical Users */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Shortcuts:
          </span>
          {PRESET_SHORTCUTS.map((shortcut, i) => (
            <button
              key={i}
              type="button"
              disabled={isCompiling}
              onClick={() => {
                setPrompt(shortcut.prompt);
                handleDecomposeAndAssemble(shortcut.prompt, shortcut.category);
              }}
              className="px-2.5 py-1 text-xs text-slate-700 bg-slate-100 hover:bg-cobalt-50 hover:text-cobalt-700 hover:border-cobalt-200 border border-slate-200 rounded-md transition-colors"
            >
              {shortcut.label}
            </button>
          ))}
        </div>

        {compilerBanner && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{compilerBanner}</span>
          </div>
        )}

        {errorBanner && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
        )}
      </div>

      {/* 2. Pipeline Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase">
            <Coins className="w-3.5 h-3.5 text-cobalt-600" />
            <span>Run Cost ({currency})</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {formatCost(pipeline.totalCostPaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            ₹{(pipeline.totalCostPaise / 100).toLocaleString("en-IN")} paise
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase">
            <Clock className="w-3.5 h-3.5 text-cobalt-600" />
            <span>Est. Latency</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {(pipeline.estimatedLatencyMs / 1000).toFixed(2)}s
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-mono">
            &lt; 3.5s SLA Guaranteed
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase">
            <Layers className="w-3.5 h-3.5 text-cobalt-600" />
            <span>DAG Stages</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1">
            {pipeline.nodes.length} Nodes
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {pipeline.connections.length} Live Bindings
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Certification Seal</span>
          </div>
          <div className="text-xs font-bold font-mono text-slate-900 mt-1 truncate">
            {pipeline.certificationSeal || "PH-SEAL-PENDING"}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
            {pipeline.certificationStatus}
          </div>
        </div>
      </div>

      {/* 3. Interactive DAG Canvas with SVG Pipes & Glowing Nodes */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <GitFork className="w-4 h-4 text-cobalt-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Interactive Multi-Agent DAG Canvas
              </h3>
              <p className="text-xs text-slate-500">
                Deterministic sequential execution graph with typed parameter pipes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400">
              Click node to inspect parameters
            </span>
            <button
              type="button"
              onClick={() => setIsRunnerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-md shadow-2xs transition-colors"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Run Pipeline</span>
            </button>
          </div>
        </div>

        {/* Canvas Visual Viewport */}
        <div className="relative p-6 rounded-xl border border-slate-200 bg-porcelain-100 overflow-hidden">
          {/* Blueprint Dot Matrix Pattern */}
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(#0B4FBA 0.75px, transparent 0.75px)",
              backgroundSize: "16px 16px",
            }}
          />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {pipeline.nodes.map((node, index) => {
              const Icon = getNodeIcon(node.stage);
              const isSelected = selectedNodeId === node.id;
              const isRunning = runningNodeId === node.id;

              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode?.(node.id)}
                  className={`cursor-pointer rounded-xl p-4 bg-white border-2 transition-all relative ${
                    isRunning
                      ? "border-cobalt-500 ring-4 ring-cobalt-500/25 shadow-lg animate-pulse"
                      : isSelected
                      ? "border-cobalt-500 shadow-md ring-2 ring-cobalt-500/30"
                      : "border-slate-200 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  {/* Stage indicator header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Step {index + 1}: {node.stage}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {(node.estimatedLatencyMs / 1000).toFixed(2)}s
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cobalt-50 border border-cobalt-200 text-cobalt-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {node.agentName}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                        {node.description}
                      </div>
                    </div>
                  </div>

                  {/* Ports handles */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600">
                      {formatCost(node.costPaise)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {node.inputParameters.length} in &bull; {node.outputParameters.length} out
                    </span>
                  </div>

                  {/* Desktop Stage Connector */}
                  {index < pipeline.nodes.length - 1 && (
                    <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-slate-300 items-center justify-center text-slate-500 shadow-2xs">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Parameter Mappings Overview */}
        <div className="p-3.5 bg-porcelain-100 rounded-lg border border-slate-200 space-y-2">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cobalt-600" />
            <span>Dynamic Parameter Mappings (DAG Pipes)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {pipeline.connections.map((conn) => {
              const fromNode = pipeline.nodes.find((n) => n.id === conn.fromNodeId);
              const toNode = pipeline.nodes.find((n) => n.id === conn.toNodeId);
              return (
                <div
                  key={conn.id}
                  className="p-2.5 bg-white border border-slate-200 rounded-md font-mono flex items-center justify-between gap-2"
                >
                  <div className="truncate">
                    <span className="text-slate-500">{fromNode?.stageName.split(" ")[0]}.</span>
                    <span className="font-semibold text-cobalt-700">{conn.fromOutputKey}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <div className="truncate text-right">
                    <span className="text-slate-500">{toNode?.stageName.split(" ")[0]}.</span>
                    <span className="font-semibold text-slate-800">{conn.toInputKey}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live Execution Orchestrator Runner Modal */}
      <LivePipelineRunner
        pipeline={pipeline}
        isOpen={isRunnerOpen}
        onClose={() => {
          setIsRunnerOpen(false);
          setRunningNodeId(null);
        }}
        onActiveNodeChange={(nodeId) => setRunningNodeId(nodeId)}
      />
    </div>
  );
}
