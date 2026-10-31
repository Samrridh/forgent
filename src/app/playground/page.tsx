"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AGENTS_DATASET, getAgentBySlug } from "@/data/agents";
import { Agent } from "@/types/agent";
import {
  SandboxExecutionResult,
  SandboxTelemetryChunk,
  SandboxToolPermissions,
} from "@/lib/contracts/sandbox-types";
import { SandboxAgentSelector } from "@/components/sandbox/sandbox-agent-selector";
import { SandboxInputEditor } from "@/components/sandbox/sandbox-input-editor";
import { SandboxTelemetryWaterfall } from "@/components/sandbox/sandbox-telemetry-waterfall";
import { SandboxToolInspector } from "@/components/sandbox/sandbox-tool-inspector";
import { SandboxTestExportModal } from "@/components/sandbox/sandbox-test-export-modal";
import {
  Play,
  Radio,
  FileCode,
  RotateCcw,
  Activity,
  Shield,
  Terminal,
  Cpu,
  Server,
  Lock,
} from "lucide-react";

export default function PlaygroundPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-mono text-xs">Loading Agent Sandbox...</div>}>
      <PlaygroundPageContent />
    </Suspense>
  );
}

function PlaygroundPageContent() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("agent") || "3-way-erp-invoice-reconciler";
  const defaultAgent = getAgentBySlug(initialSlug) || AGENTS_DATASET[0];

  const [selectedAgent, setSelectedAgent] = useState<Agent>(defaultAgent);
  const [executionMode, setExecutionMode] = useState<"mock" | "live">("mock");
  const [latencyCeilingMs, setLatencyCeilingMs] = useState<number>(3500);

  const [toolPermissions, setToolPermissions] = useState<SandboxToolPermissions>({
    zeroTrustPiiMasking: true,
    networkEgressContainment: true,
    consequentialStateMutationLock: true,
    allowedCapabilities: ["compute:variance", "read:analytics", "extract:evidence"],
  });

  const [inputPayload, setInputPayload] = useState<Record<string, unknown>>({
    invoiceNumber: "INV-2026-9041",
    amountPaise: 450000,
    vendorId: "vendor_apex_solutions",
    discrepancyThresholdPaise: 100,
    strictReconciliation: true,
  });

  const [testToolPayload, setTestToolPayload] = useState<Record<string, unknown>>({
    callerService: "erp_sync_engine",
    apiKey: "sk_live_9a8b7c6d5e4f3a2b1c0d",
    ssnIdentifier: "000-12-3456",
    customerEmail: "finance.controller@enterprise.internal",
  });

  const [isRunning, setIsRunning] = useState(false);
  const [streamStage, setStreamStage] = useState<string>("IDLE");
  const [streamingText, setStreamingText] = useState("");
  const [activeTab, setActiveTab] = useState<"output" | "waterfall" | "gateway" | "prompt">("output");
  const [lastResult, setLastResult] = useState<SandboxExecutionResult | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);

  // Update selected agent if query param changes
  useEffect(() => {
    const slugParam = searchParams.get("agent");
    if (slugParam) {
      const match = getAgentBySlug(slugParam);
      if (match) setSelectedAgent(match);
    }
  }, [searchParams]);

  // Execute Non-Streaming Sandbox
  const handleRunExecution = async () => {
    setIsRunning(true);
    setStreamStage("CONNECTING");
    setTelemetryLogs(["Initiating direct sandbox execution..."]);
    setStreamingText("");

    try {
      const res = await fetch("/api/sandbox/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentSlug: selectedAgent.slug,
          inputPayload,
          executionMode,
          latencyCeilingMs,
          toolPermissions,
          testToolPayload,
        }),
      });

      if (!res.ok) {
        throw new Error(`Execution error: ${res.statusText}`);
      }

      const result: SandboxExecutionResult = await res.json();
      setLastResult(result);
      setStreamingText(result.summaryMarkdown);
      setStreamStage(result.status);
      setTelemetryLogs((prev) => [
        ...prev,
        `Execution finished with status ${result.status} in ${result.waterfall.totalLatencyMs}ms.`,
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setStreamStage("ERROR");
      setTelemetryLogs((prev) => [...prev, `Error: ${msg}`]);
    } finally {
      setIsRunning(false);
    }
  };

  // Execute SSE Streaming Sandbox
  const handleStreamExecution = async () => {
    setIsRunning(true);
    setStreamStage("INIT");
    setStreamingText("");
    setTelemetryLogs(["Opening Server-Sent Events stream..."]);

    try {
      const response = await fetch("/api/sandbox/execute?stream=true", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          agentSlug: selectedAgent.slug,
          inputPayload,
          executionMode,
          latencyCeilingMs,
          toolPermissions,
          testToolPayload,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Unable to establish SSE telemetry stream.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          const eventLine = block.match(/^event:\s*(\w+)/m);
          const dataLine = block.match(/^data:\s*(.+)$/m);

          if (eventLine && dataLine) {
            const eventType = eventLine[1];
            const data = JSON.parse(dataLine[1]);

            if (eventType === "chunk") {
              const chunk: SandboxTelemetryChunk = data;
              setStreamStage(chunk.stage);
              setTelemetryLogs((prev) => [...prev, `[${chunk.stage}] ${chunk.message}`]);
              if (chunk.accumulatedText) {
                setStreamingText(chunk.accumulatedText);
              }
            } else if (eventType === "complete") {
              const completeResult: SandboxExecutionResult = data;
              setLastResult(completeResult);
              setStreamStage(completeResult.status);
              setStreamingText(completeResult.summaryMarkdown);
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Streaming connection failure";
      setStreamStage("ERROR");
      setTelemetryLogs((prev) => [...prev, `Stream error: ${msg}`]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleResetDefaults = () => {
    setExecutionMode("mock");
    setLatencyCeilingMs(3500);
    setToolPermissions({
      zeroTrustPiiMasking: true,
      networkEgressContainment: true,
      consequentialStateMutationLock: true,
      allowedCapabilities: ["compute:variance", "read:analytics"],
    });
    setStreamingText("");
    setLastResult(null);
    setStreamStage("IDLE");
  };

  return (
    <div className="min-h-screen bg-porcelain-100/60 pb-16">
      {/* Top Banner Header */}
      <section className="bg-white border-b border-slate-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cobalt-50 text-cobalt-700 border border-cobalt-200 font-bold">
                Developer & Buyer Agent Sandbox
              </span>
              <span className="text-xs font-mono text-slate-400">/playground</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Agent Execution Playground
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Profile catalog agents with live telemetry waterfalls, zero-trust tool gateway sanitization, and qualification test exports.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              type="button"
              disabled={isRunning}
              onClick={handleRunExecution}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border border-cobalt-600 bg-white hover:bg-cobalt-50 text-cobalt-700 transition-colors shadow-xs disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              Run Non-Streaming
            </button>

            <button
              type="button"
              disabled={isRunning}
              onClick={handleStreamExecution}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-cobalt-600 hover:bg-cobalt-700 text-white transition-colors shadow-xs disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 ${isRunning ? "animate-pulse" : ""}`} />
              Stream Telemetry
            </button>

            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-cobalt-600" />
              Export Test Fixture
            </button>
          </div>
        </div>
      </section>

      {/* Main Workspace Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Agent Selector, Inputs & Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Agent Combobox */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Select Agent from Catalog (500 Available)</span>
                <span className="text-[10px] font-mono text-slate-400">Deterministic & Verified</span>
              </label>
              <SandboxAgentSelector
                selectedAgent={selectedAgent}
                onSelectAgent={(agent) => {
                  setSelectedAgent(agent);
                  setInputPayload({
                    documentType: `${agent.category.toLowerCase()}_sample_job`,
                    batchId: `batch-${Date.now().toString(36)}`,
                    strictMode: true,
                  });
                }}
              />
            </div>

            {/* 2. Execution Runtime Controls Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-cobalt-600" />
                  Runtime Parameters
                </span>
                <span className="text-[10px] font-mono text-slate-400">Offline Resilience Active</span>
              </div>

              {/* Mock vs Live Switch */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-600 uppercase">
                  Execution Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExecutionMode("mock")}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      executionMode === "mock"
                        ? "bg-cobalt-50 text-cobalt-700 border-cobalt-300 font-semibold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Deterministic Mock
                  </button>
                  <button
                    type="button"
                    onClick={() => setExecutionMode("live")}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border text-center transition-all ${
                      executionMode === "live"
                        ? "bg-cobalt-50 text-cobalt-700 border-cobalt-300 font-semibold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    Live LLM Backend
                  </button>
                </div>
              </div>

              {/* Latency Ceiling Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-600">Latency SLA Ceiling:</span>
                  <span className="font-mono font-bold text-slate-900">{latencyCeilingMs}ms</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={6000}
                  step={100}
                  value={latencyCeilingMs}
                  onChange={(e) => setLatencyCeilingMs(parseInt(e.target.value, 10))}
                  className="w-full accent-cobalt-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>500ms (Aggressive)</span>
                  <span>3,500ms (Default)</span>
                  <span>6,000ms</span>
                </div>
              </div>

              {/* Tool Security Policy Toggles */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-mono text-slate-600 uppercase flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-slate-500" /> Tool Gateway Security
                </span>
                <div className="space-y-1.5 text-xs">
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-slate-50">
                    <span className="text-slate-700">Zero-Trust PII Masking</span>
                    <input
                      type="checkbox"
                      checked={toolPermissions.zeroTrustPiiMasking}
                      onChange={(e) =>
                        setToolPermissions({
                          ...toolPermissions,
                          zeroTrustPiiMasking: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-cobalt-600 focus:ring-cobalt-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-slate-50">
                    <span className="text-slate-700">Network Egress Containment</span>
                    <input
                      type="checkbox"
                      checked={toolPermissions.networkEgressContainment}
                      onChange={(e) =>
                        setToolPermissions({
                          ...toolPermissions,
                          networkEgressContainment: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-cobalt-600 focus:ring-cobalt-500"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-slate-50">
                    <span className="text-slate-700">State Mutation Dual-Auth Lock</span>
                    <input
                      type="checkbox"
                      checked={toolPermissions.consequentialStateMutationLock}
                      onChange={(e) =>
                        setToolPermissions({
                          ...toolPermissions,
                          consequentialStateMutationLock: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-cobalt-600 focus:ring-cobalt-500"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Input Payload Editor */}
            <SandboxInputEditor
              agent={selectedAgent}
              payload={inputPayload}
              onChange={setInputPayload}
              onSetTestToolPayload={setTestToolPayload}
            />
          </div>

          {/* Right Column: Execution Telemetry & Output Dashboard (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Telemetry Status Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-lg bg-porcelain-100">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Stream Status</div>
                  <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                    {streamStage}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-porcelain-100">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Total Latency</div>
                  <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                    {lastResult ? `${lastResult.waterfall.totalLatencyMs}ms` : "--"}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-porcelain-100">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Memory RSS</div>
                  <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                    {lastResult ? lastResult.memory.formattedHeapUsed : "--"}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-porcelain-100">
                  <div className="text-[10px] font-mono uppercase text-slate-400">Dual Cost ($ / ₹)</div>
                  <div className="font-mono text-xs font-bold text-slate-900 mt-0.5">
                    {lastResult
                      ? `${lastResult.tokens.formattedCostUsd} / ${lastResult.tokens.formattedCostInr}`
                      : "--"}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabbed Results Pane */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              {/* Tabs Navigation */}
              <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-100 bg-porcelain-100/60 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("output")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "output"
                      ? "border-cobalt-600 text-cobalt-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Streaming Deliverable
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("waterfall")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "waterfall"
                      ? "border-cobalt-600 text-cobalt-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Latency Waterfall
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("gateway")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "gateway"
                      ? "border-cobalt-600 text-cobalt-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Tool Gateway Sanitizer
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("prompt")}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === "prompt"
                      ? "border-cobalt-600 text-cobalt-700"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Prompt & Telemetry
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5">
                {activeTab === "output" && (
                  <div className="space-y-4">
                    {/* Live Output Text Area */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span>Agent Markdown & Deliverable Stream</span>
                        {isRunning && (
                          <span className="text-cobalt-600 font-mono text-[11px] animate-pulse">
                            Receiving chunks...
                          </span>
                        )}
                      </div>
                      <div className="h-96 rounded-lg bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-auto border border-slate-800 whitespace-pre-wrap">
                        {streamingText || "Ready. Click 'Stream Telemetry' or 'Run Non-Streaming' to initiate."}
                      </div>
                    </div>

                    {/* Telemetry Stream Log */}
                    <div className="p-3 rounded-lg bg-porcelain-100 border border-slate-200">
                      <div className="text-[11px] font-mono text-slate-400 mb-1">
                        Recent Telemetry Events:
                      </div>
                      <div className="space-y-1 text-xs font-mono text-slate-600 max-h-24 overflow-y-auto">
                        {telemetryLogs.map((log, idx) => (
                          <div key={idx} className="truncate">
                            &gt; {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "waterfall" && (
                  <SandboxTelemetryWaterfall
                    waterfall={lastResult?.waterfall}
                    isLoading={isRunning}
                  />
                )}

                {activeTab === "gateway" && (
                  <SandboxToolInspector inspection={lastResult?.toolInspection} />
                )}

                {activeTab === "prompt" && (
                  <div className="space-y-4 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="text-slate-700 font-semibold">Deterministic System Instruction:</div>
                      <div className="p-3 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {lastResult?.systemPrompt || "Execute task to view deterministic system prompt."}
                      </div>
                    </div>

                    {lastResult?.diagnostic && (
                      <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                        <div className="font-semibold">Provider Diagnostics:</div>
                        <div>{lastResult.diagnostic.hint}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Qualification Test Export Modal */}
      <SandboxTestExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        agent={selectedAgent}
        inputPayload={inputPayload}
        outputPayload={lastResult?.structuredOutput}
        latencyCeilingMs={latencyCeilingMs}
      />
    </div>
  );
}
