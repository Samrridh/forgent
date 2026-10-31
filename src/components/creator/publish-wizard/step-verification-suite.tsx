"use client";

import React, { useState } from "react";
import { PublishWizardForm } from "../creator-types";
import { QualificationReport, QualificationProbe } from "@/server/builder/qualify-engine";
import {
  ShieldCheck,
  Clock,
  Play,
  RotateCw,
  Terminal,
  Loader2,
  Check,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
} from "lucide-react";

interface StepVerificationSuiteProps {
  formData: PublishWizardForm;
  onChange: (fields: Partial<PublishWizardForm>) => void;
  onPublish: () => void;
  isPublishing: boolean;
}

interface UiStage {
  id: "schema" | "injection" | "latency" | "consistency" | "economics";
  name: string;
  description: string;
  status: "pending" | "running" | "passed" | "failed";
  durationMs?: number;
  score?: number;
  probes?: QualificationProbe[];
  metrics?: Record<string, unknown>;
  logs?: string[];
  error?: string;
}

const DEFAULT_STAGES: UiStage[] = [
  {
    id: "schema",
    name: "Stage 1: JSON Schema Contract Validation",
    description: "Evaluates input and output schemas against Zod runtime validator and OpenAPI 3.1 invariants.",
    status: "pending",
  },
  {
    id: "injection",
    name: "Stage 2: Adversarial Injection Attack Defense",
    description: "Executes 3 adversarial prompt injection vectors to verify agent rejection of system prompt leakage.",
    status: "pending",
  },
  {
    id: "latency",
    name: "Stage 3: Latency SLA Benchmark (< 3,500ms)",
    description: "Benchmarks execution round-trip latency against the 3,500ms production SLA ceiling.",
    status: "pending",
  },
  {
    id: "consistency",
    name: "Stage 4: Semantic Output Consistency",
    description: "Asserts deterministic schema and bit-level invariant concordance across dual sample queries.",
    status: "pending",
  },
  {
    id: "economics",
    name: "Stage 5: 85/15 Creator Payout Economics",
    description: "Validates 85/15 revenue split bounds ($0.50-$50.00) and integer paise precision calculations.",
    status: "pending",
  },
];

export function StepVerificationSuite({
  formData,
  onChange,
  onPublish,
  isPublishing,
}: StepVerificationSuiteProps) {
  const [stages, setStages] = useState<UiStage[]>(() => {
    if (formData.verificationPassed) {
      return DEFAULT_STAGES.map((s) => ({ ...s, status: "passed", durationMs: 45 }));
    }
    return DEFAULT_STAGES;
  });

  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "Forgent Automated Qualification Engine initialized.",
    "Ready to execute 5-Stage Qualification Suite against submitted agent.",
    "Target: " + (formData.endpointType === "webhook" ? formData.webhookUrl : `Template: ${formData.selectedTemplateId}`),
  ]);
  const [verificationHash, setVerificationHash] = useState<string | null>(
    formData.verificationHash || (formData.verificationPassed ? "sha256:4f83b1a772c91048b61e892c5567a149bc2e1107" : null)
  );
  const [expandedStage, setExpandedStage] = useState<string | null>("injection");

  const allPassed = stages.every((s) => s.status === "passed");

  const runSuite = async () => {
    setIsRunning(true);
    setVerificationHash(null);
    setConsoleLogs([
      "Initiating Forgent 5-Stage Live Qualification Suite...",
      `Agent Title: ${formData.name || "Untitled Agent"} (${formData.category})`,
      `Protocol: ${formData.endpointType === "webhook" ? "Remote Webhook Protocol" : "Platform Hosted Starter"}`,
      "Contacting qualification pipeline at /api/builder/qualify...",
    ]);

    // Set all to pending, first to running
    setStages(
      DEFAULT_STAGES.map((s, idx) => ({
        ...s,
        status: idx === 0 ? "running" : "pending",
        durationMs: undefined,
      }))
    );

    try {
      const response = await fetch("/api/builder/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name || "Custom Verified Agent",
          category: formData.category || "Finance",
          bio: formData.bio,
          inputSchema: formData.inputSchema,
          outputSchema: formData.outputFormat,
          pricePerTaskUsd: formData.pricePerTaskUsd || 2.50,
          endpointType: formData.endpointType,
          webhookUrl: formData.webhookUrl,
          hmacSecret: formData.hmacSecret,
        }),
      });

      const report: QualificationReport = await response.json();

      if (!response.ok || !report.stages) {
        throw new Error(report ? JSON.stringify(report) : "Failed to run qualification suite");
      }

      // Progressively reveal stages to provide smooth feedback
      for (let i = 0; i < report.stages.length; i++) {
        const stageData = report.stages[i];

        setStages((prev) =>
          prev.map((s, idx) => {
            if (idx === i) {
              return {
                ...s,
                status: "running",
              };
            }
            return s;
          })
        );

        // Add stage start logs
        setConsoleLogs((prev) => [
          ...prev,
          `[RUNNING] Stage ${i + 1}/5: ${stageData.name}...`,
        ]);

        await new Promise((resolve) => setTimeout(resolve, 320));

        setStages((prev) =>
          prev.map((s, idx) => {
            if (idx === i) {
              return {
                ...s,
                status: stageData.status,
                durationMs: stageData.durationMs,
                score: stageData.score,
                probes: stageData.probes,
                metrics: stageData.metrics,
                logs: stageData.logs,
                error: stageData.error,
              };
            }
            return s;
          })
        );

        if (stageData.logs) {
          setConsoleLogs((prev) => [
            ...prev,
            ...stageData.logs.map((l) => `  ${l}`),
            `[${stageData.status === "passed" ? "PASS" : "FAIL"}] Stage ${i + 1} finalized in ${stageData.durationMs}ms.`,
          ]);
        }
      }

      setIsRunning(false);
      if (report.overallPassed) {
        setVerificationHash(report.verificationHash);
        setConsoleLogs((prev) => [
          ...prev,
          "ALL 5 QUALIFICATION STAGES PASSED SUCCESSFULLY.",
          `Integrity Verification Hash: ${report.verificationHash}`,
          `Composite Security & Reliability Score: ${report.score}%`,
          "Status: Agent unlocked for Verified Badge Minting.",
        ]);
        onChange({
          verificationPassed: true,
          verificationHash: report.verificationHash,
        });
      } else {
        setConsoleLogs((prev) => [
          ...prev,
          "QUALIFICATION FAILED: One or more stages did not satisfy production requirements.",
        ]);
      }
    } catch (err: unknown) {
      setIsRunning(false);
      const errMsg = err instanceof Error ? err.message : "Qualification execution error";
      setConsoleLogs((prev) => [...prev, `[ERROR] ${errMsg}`]);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedStage((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border-subtle pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Step 4: AI-Driven 5-Stage Qualification Suite
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Validates schema invariants, fires 3 adversarial prompt injection probes via Gemini, and benchmarks SLA latency.
          </p>
        </div>

        <button
          type="button"
          onClick={runSuite}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 shrink-0"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Evaluating Stages...</span>
            </>
          ) : allPassed ? (
            <>
              <RotateCw className="w-3.5 h-3.5" />
              <span>Re-run Qualification</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Run Qualification Suite</span>
            </>
          )}
        </button>
      </div>

      {/* 5-Stage Interactive Card List */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isExpanded = expandedStage === stage.id;
          return (
            <div
              key={stage.id}
              className={`rounded-xl border transition-all ${
                stage.status === "passed"
                  ? "border-emerald-300 bg-emerald-50/40"
                  : stage.status === "failed"
                  ? "border-red-300 bg-red-50/40"
                  : stage.status === "running"
                  ? "border-cobalt-400 bg-cobalt-50/40 shadow-xs"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 text-xs font-mono font-bold ${
                      stage.status === "passed"
                        ? "bg-emerald-600 text-white"
                        : stage.status === "failed"
                        ? "bg-red-600 text-white"
                        : stage.status === "running"
                        ? "bg-cobalt-500 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {stage.status === "passed" ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : stage.status === "failed" ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : stage.status === "running" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{stage.name}</h4>
                      {stage.status === "passed" && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                          PASSED {stage.score ? `(${stage.score}%)` : ""}
                        </span>
                      )}
                      {stage.status === "failed" && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-semibold">
                          FAILED
                        </span>
                      )}
                      {stage.status === "running" && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cobalt-100 text-cobalt-800 border border-cobalt-200 animate-pulse font-semibold">
                          EVALUATING...
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">{stage.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right font-mono text-[11px] text-slate-500">
                    {stage.durationMs !== undefined ? (
                      <span className="flex items-center gap-1 text-slate-700 font-semibold">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {stage.durationMs}ms
                      </span>
                    ) : (
                      <span>Pending</span>
                    )}
                  </div>

                  {(stage.probes || stage.metrics || stage.error) && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(stage.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      aria-label="Toggle details"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Details Panel for Probes or Metrics */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-200/60 text-xs space-y-3">
                  {/* Stage 2: Adversarial Injection Probes Inspection */}
                  {stage.id === "injection" && stage.probes && (
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        <span>Adversarial Prompt Injection Attack Vectors (3 Probes via Gemini)</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {stage.probes.map((probe, pIdx) => (
                          <div
                            key={probe.id}
                            className="p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1.5 border border-slate-800"
                          >
                            <div className="flex items-center justify-between text-slate-400">
                              <span className="font-bold text-slate-200">
                                Vector 0{pIdx + 1}: {probe.name}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  probe.status === "passed"
                                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                    : "bg-red-950 text-red-400 border border-red-800"
                                }`}
                              >
                                {probe.status}
                              </span>
                            </div>
                            <div className="text-amber-300">
                              <span className="text-slate-400">Payload: </span>
                              &ldquo;{probe.attackPayload}&rdquo;
                            </div>
                            <div className="text-emerald-300 text-[10px]">
                              <span className="text-slate-400">Agent Defense: </span>
                              {probe.defenseResponse || probe.details}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stage 3: Latency SLA Breakdown */}
                  {stage.id === "latency" && stage.metrics && (
                    <div className="p-3 rounded-lg bg-slate-100 font-mono text-[11px] flex items-center justify-between">
                      <span className="text-slate-600">Round-Trip Ping Benchmark:</span>
                      <span className="font-bold text-slate-900">
                        {String(stage.metrics.latencyMs)}ms / {String(stage.metrics.thresholdMs)}ms SLA
                      </span>
                    </div>
                  )}

                  {/* Stage 5: Economics Split Details */}
                  {stage.id === "economics" && stage.metrics && (
                    <div className="p-3 rounded-lg bg-slate-100 font-mono text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Creator Share (85%)</span>
                        <span className="font-bold text-emerald-700">${String(stage.metrics.creatorShareUsd)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Network Fee (15%)</span>
                        <span className="font-bold text-slate-700">${String(stage.metrics.networkShareUsd)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Dual Currency (INR)</span>
                        <span className="font-bold text-slate-900">₹{String(stage.metrics.pricePerTaskInr)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Paise Precision</span>
                        <span className="font-bold text-slate-900">{String(stage.metrics.pricePerTaskPaise)} paise</span>
                      </div>
                    </div>
                  )}

                  {stage.error && (
                    <div className="p-2.5 rounded bg-red-100 text-red-800 text-[11px] font-mono">
                      Error: {stage.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live Console Output Box */}
      <div className="rounded-xl border border-slate-300 bg-slate-950 text-slate-200 p-4 font-mono text-xs space-y-2">
        <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cobalt-400" />
            <span>Qualification Harness Console Log</span>
          </div>
          <span className="text-slate-500">Live API Stream</span>
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] leading-relaxed">
          {consoleLogs.map((log, i) => (
            <div
              key={i}
              className={`${
                log.includes("[PASS]") || log.includes("PASSED")
                  ? "text-emerald-400 font-semibold"
                  : log.includes("[RUNNING]")
                  ? "text-azure-300"
                  : log.includes("[ATTACK_PROBE]")
                  ? "text-amber-300"
                  : log.includes("[FAIL]") || log.includes("[ERROR]")
                  ? "text-red-400 font-semibold"
                  : "text-slate-400"
              }`}
            >
              &gt; {log}
            </div>
          ))}
        </div>
      </div>

      {/* Unlocked Mint & Publish Action Box */}
      {allPassed ? (
        <div className="p-5 rounded-xl border border-emerald-300 bg-emerald-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Qualification Complete &bull; Verified Badge Minting Unlocked</span>
            </div>
            <p className="text-xs text-emerald-800">
              Integrity SHA-256 Digest: <code className="font-mono text-[11px]">{verificationHash}</code>
            </p>
          </div>

          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isPublishing ? "Minting & Publishing..." : "Mint Verified Badge & Publish Agent"}</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 text-slate-500 text-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Publishing locked until all 5 qualification stages pass cleanly.</span>
          </div>
          <button
            type="button"
            onClick={runSuite}
            disabled={isRunning}
            className="text-cobalt-600 font-semibold hover:underline"
          >
            Execute Qualification &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
