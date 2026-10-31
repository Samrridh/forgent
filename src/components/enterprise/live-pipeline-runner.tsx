"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  EnterprisePipeline,
} from "@/lib/contracts/enterprise-types";
import { EvidenceReceipt } from "@/server/engine/receipt";
import { useCurrency } from "@/context/currency-context";
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Clock,
  Coins,
  ShieldCheck,
  Copy,
  Check,
  FileText,
  Code2,
  Layers,
  ArrowRight,
} from "lucide-react";

interface LivePipelineRunnerProps {
  pipeline: EnterprisePipeline;
  isOpen: boolean;
  onClose: () => void;
  onActiveNodeChange?: (nodeId: string | null) => void;
}

interface LogEntry {
  timestamp: string;
  step: string;
  message: string;
}

export function LivePipelineRunner({
  pipeline,
  isOpen,
  onClose,
  onActiveNodeChange,
}: LivePipelineRunnerProps) {
  const { formatPrice } = useCurrency();
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeStageIndex, setActiveStageIndex] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [totalTokens, setTotalTokens] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, "pending" | "running" | "verified" | "error">>({});
  const [deliverable, setDeliverable] = useState<{
    summaryMarkdown: string;
    structuredJson: Record<string, unknown>;
  } | null>(null);
  const [receipt, setReceipt] = useState<EvidenceReceipt | null>(null);
  const [activeTab, setActiveTab] = useState<"report" | "json" | "receipt">("report");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Initialize node statuses
  useEffect(() => {
    if (pipeline?.nodes) {
      const initial: Record<string, "pending" | "running" | "verified" | "error"> = {};
      pipeline.nodes.forEach((n) => {
        initial[n.id] = "pending";
      });
      setNodeStatuses(initial);
    }
  }, [pipeline]);

  // Autoscroll terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  if (!isOpen) return null;

  const startExecution = async () => {
    setIsRunning(true);
    setIsCompleted(false);
    setErrorMsg(null);
    setLogs([]);
    setElapsedMs(0);
    setTotalTokens(0);
    setDeliverable(null);
    setReceipt(null);

    const initialStatuses: Record<string, "pending" | "running" | "verified" | "error"> = {};
    pipeline.nodes.forEach((n) => {
      initialStatuses[n.id] = "pending";
    });
    setNodeStatuses(initialStatuses);

    const startTime = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 50);

    try {
      const execRes = await fetch("/api/pipeline/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline }),
      });

      if (!execRes.ok) {
        const errorData = await execRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Execution failed with HTTP ${execRes.status}`);
      }

      const execData = await execRes.json();
      const executionId = execData.executionId;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(`/api/pipeline/stream?id=${executionId}`);
      eventSourceRef.current = es;

      es.addEventListener("pipeline_init", (e) => {
        const data = JSON.parse(e.data);
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            step: "INITIALIZATION",
            message: `Pipeline "${data.pipelineName}" initialized across ${data.nodeCount} stages.`,
          },
        ]);
      });

      es.addEventListener("node_start", (e) => {
        const data = JSON.parse(e.data);
        setActiveNodeId(data.nodeId);
        setActiveStageIndex(data.stageIndex);
        onActiveNodeChange?.(data.nodeId);

        setNodeStatuses((prev) => ({
          ...prev,
          [data.nodeId]: "running",
        }));

        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            step: `STAGE_${data.stage}`,
            message: `Starting node ${data.nodeName} (${data.stage})`,
          },
        ]);
      });

      es.addEventListener("node_chunk", (e) => {
        const data = JSON.parse(e.data);
        if (data.tokens) setTotalTokens(data.tokens);

        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            step: "STREAM",
            message: data.chunk,
          },
        ]);
      });

      es.addEventListener("node_done", (e) => {
        const data = JSON.parse(e.data);
        setNodeStatuses((prev) => ({
          ...prev,
          [data.nodeId]: "verified",
        }));

        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            step: "VERIFIED",
            message: `Stage ${data.stage} verified in ${data.latencyMs}ms. Output schema certified.`,
          },
        ]);
      });

      es.addEventListener("pipeline_done", (e) => {
        const data = JSON.parse(e.data);
        if (timerRef.current) clearInterval(timerRef.current);
        es.close();

        setIsRunning(false);
        setIsCompleted(true);
        setActiveNodeId(null);
        onActiveNodeChange?.(null);
        setElapsedMs(data.totalLatencyMs);
        setTotalTokens(data.totalTokens);
        setDeliverable(data.deliverable);
        setReceipt(data.receipt);

        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toLocaleTimeString(),
            step: "COMMIT",
            message: `Execution complete. Cryptographic receipt generated with SHA-256 seal: ${data.receipt?.integrityHash?.slice(0, 16)}...`,
          },
        ]);
      });

      es.addEventListener("pipeline_error", (e) => {
        const data = JSON.parse(e.data);
        if (timerRef.current) clearInterval(timerRef.current);
        es.close();
        setIsRunning(false);
        setErrorMsg(data.error || "Pipeline execution failed");
      });

      es.onerror = () => {
        if (!isCompleted) {
          if (timerRef.current) clearInterval(timerRef.current);
          es.close();
          setIsRunning(false);
        }
      };
    } catch (err: unknown) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRunning(false);
      setErrorMsg(err instanceof Error ? err.message : "Pipeline execution failed");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatCost = (costPaise: number) => {
    const usd = costPaise / 8000;
    return formatPrice(usd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cobalt-500 text-white flex items-center justify-center shadow-xs">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  {pipeline.name}
                </h2>
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-200 uppercase">
                  {pipeline.category}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Live Deterministic Orchestrator &bull; {pipeline.nodes.length} Stages
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isRunning && !isCompleted && (
              <button
                type="button"
                onClick={startExecution}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch Execution</span>
              </button>
            )}

            {isRunning && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cobalt-50 border border-cobalt-200 text-cobalt-700 text-xs font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-cobalt-600" />
                <span>Running Stage {activeStageIndex + 1} of {pipeline.nodes.length}</span>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Committed & Verified</span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="Close runner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sequential Stage Stepper with Royal Cobalt Glow */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Execution Stage Progression</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {pipeline.nodes.length} Deterministic Stages
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {pipeline.nodes.map((node, idx) => {
                const status = nodeStatuses[node.id] || "pending";
                const isCurrentActive = activeNodeId === node.id;

                return (
                  <div
                    key={node.id}
                    className={`p-3.5 rounded-xl border-2 transition-all relative ${
                      isCurrentActive
                        ? "border-cobalt-500 bg-cobalt-50/30 ring-4 ring-cobalt-500/20 shadow-md animate-pulse"
                        : status === "verified"
                        ? "border-emerald-200 bg-emerald-50/20"
                        : "border-slate-200 bg-white opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        Step {idx + 1}: {node.stage}
                      </span>
                      {status === "verified" ? (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      ) : isCurrentActive ? (
                        <span className="font-mono text-[10px] text-cobalt-700 font-bold uppercase animate-pulse">
                          Executing...
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-slate-400">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-900 truncate">
                      {node.agentName}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {node.description}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-600">
                        {formatCost(node.costPaise)}
                      </span>
                      <span className="text-slate-400">
                        {(node.estimatedLatencyMs / 1000).toFixed(2)}s SLA
                      </span>
                    </div>

                    {idx < pipeline.nodes.length - 1 && (
                      <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-white border border-slate-300 items-center justify-center text-slate-400 shadow-2xs">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Telemetry Panel: Latency Stopwatch & Token Counter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-porcelain-100 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase">
                <Clock className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Elapsed Latency</span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {(elapsedMs / 1000).toFixed(2)}s
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                SLA budget: {(pipeline.estimatedLatencyMs / 1000).toFixed(2)}s
              </div>
            </div>

            <div className="p-3.5 bg-porcelain-100 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase">
                <Coins className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Tokens Processed</span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                {totalTokens.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Total cost: {formatCost(pipeline.totalCostPaise)}
              </div>
            </div>

            <div className="p-3.5 bg-porcelain-100 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cryptographic Proof</span>
              </div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-1 truncate">
                {receipt ? receipt.integrityHash.slice(0, 16) + "..." : "Pending Commit"}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5 font-mono">
                {receipt ? "SHA-256 Validated" : "Awaiting Pipeline Done"}
              </div>
            </div>
          </div>

          {/* Streaming Stdout Logs Terminal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Live Streaming Telemetry &bull; SSE Stdout</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {logs.length} events logged
              </span>
            </div>

            <div className="bg-slate-950 text-slate-200 rounded-xl p-4 font-mono text-xs h-48 overflow-y-auto border border-slate-800 shadow-inner space-y-1">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic py-6 text-center">
                  Click &quot;Launch Execution&quot; to start live multi-agent DAG runner.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-slate-500 select-none shrink-0 font-mono text-[10px]">
                      [{log.timestamp}]
                    </span>
                    <span className="text-cobalt-400 font-semibold shrink-0 text-[11px]">
                      {log.step}:
                    </span>
                    <span className="text-slate-200 break-all">{log.message}</span>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Multi-Tab Final Deliverable Viewer */}
          {isCompleted && deliverable && receipt && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 border-b border-slate-200">
                <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveTab("report")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      activeTab === "report"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-cobalt-600" />
                    <span>Markdown Report</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("json")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      activeTab === "json"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5 text-cobalt-600" />
                    <span>Structured JSON</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("receipt")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                      activeTab === "receipt"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Evidence Receipt</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      activeTab === "report"
                        ? deliverable.summaryMarkdown
                        : activeTab === "json"
                        ? JSON.stringify(deliverable.structuredJson, null, 2)
                        : JSON.stringify(receipt, null, 2)
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tab 1: Markdown Report */}
              {activeTab === "report" && (
                <div className="p-5 font-sans text-xs leading-relaxed text-slate-800 space-y-3 whitespace-pre-line max-h-80 overflow-y-auto bg-white">
                  {deliverable.summaryMarkdown}
                </div>
              )}

              {/* Tab 2: Structured JSON */}
              {activeTab === "json" && (
                <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs max-h-80 overflow-y-auto">
                  <pre>{JSON.stringify(deliverable.structuredJson, null, 2)}</pre>
                </div>
              )}

              {/* Tab 3: Cryptographic Evidence Receipt */}
              {activeTab === "receipt" && (
                <div className="p-5 space-y-3 bg-white max-h-80 overflow-y-auto">
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-900">
                        Cryptographic Evidence Receipt Certified
                      </div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">
                        Canonical JSON state signed with SHA-256 checksum
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-white text-emerald-800 border border-emerald-300 rounded shadow-2xs">
                      VERIFIED
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase">Receipt ID</div>
                      <div className="text-slate-900 font-bold mt-0.5">{receipt.receiptId}</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded border border-slate-200">
                      <div className="text-[10px] text-slate-500 uppercase">Issued At</div>
                      <div className="text-slate-900 font-bold mt-0.5">{receipt.issuedAt}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-xs">
                    <div className="text-[10px] text-slate-500 uppercase">SHA-256 Integrity Hash</div>
                    <div className="text-cobalt-700 font-bold break-all mt-0.5">
                      {receipt.integrityHash}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-xs">
                    <div className="text-[10px] text-slate-500 uppercase">Canonical Hash Scope</div>
                    <div className="text-slate-700 break-all mt-0.5">{receipt.hashScope}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500 font-mono">
            {pipeline.id} &bull; {pipeline.certificationStatus}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Close
            </button>
            {!isRunning && (
              <button
                type="button"
                onClick={startExecution}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-sm transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isCompleted ? "Re-Run Pipeline" : "Run Pipeline"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
