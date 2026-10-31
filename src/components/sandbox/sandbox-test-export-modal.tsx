"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Agent } from "@/types/agent";
import { QualificationTestFixture } from "@/lib/contracts/sandbox-types";
import {
  Download,
  Copy,
  Check,
  X,
  FileCode,
  ShieldCheck,
  Hash,
  ExternalLink,
  Loader2,
} from "lucide-react";

type QualificationStageId =
  | "schema"
  | "injection"
  | "latency"
  | "consistency"
  | "economics";

interface SandboxTestExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  inputPayload: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  latencyCeilingMs: number;
}

export function SandboxTestExportModal({
  isOpen,
  onClose,
  agent,
  inputPayload,
  outputPayload = {},
  latencyCeilingMs,
}: SandboxTestExportModalProps) {
  const [targetStage, setTargetStage] = useState<QualificationStageId>("consistency");
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [fixture, setFixture] = useState<QualificationTestFixture | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Generate test fixture from backend route
  const generateFixture = useCallback(
    async (stage: QualificationStageId) => {
      setIsExporting(true);
      try {
        const res = await fetch("/api/sandbox/export-test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agentSlug: agent.slug,
            inputPayload,
            expectedOutput: outputPayload,
            latencyCeilingMs,
            targetStage: stage,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setFixture(data);
        }
      } catch (err) {
        console.error("Failed to export sandbox test fixture:", err);
      } finally {
        setIsExporting(false);
      }
    },
    [agent.slug, inputPayload, outputPayload, latencyCeilingMs]
  );

  useEffect(() => {
    if (isOpen) {
      generateFixture(targetStage);
    }
  }, [isOpen, targetStage, generateFixture]);

  if (!isOpen) return null;

  const fixtureJson = fixture ? JSON.stringify(fixture, null, 2) : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(fixtureJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fixtureJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-fixture-${agent.slug}-${targetStage}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  const stageOptions: Array<{ id: QualificationStageId; label: string }> = [
    { id: "consistency", label: "Consistency" },
    { id: "schema", label: "Schema" },
    { id: "injection", label: "Injection" },
    { id: "latency", label: "Latency SLA" },
    { id: "economics", label: "Economics" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-porcelain-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cobalt-500 text-white flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Export Qualification Test Fixture
              </h3>
              <p className="text-xs text-slate-500">
                Standardized verification fixture conforming to Creator Qualification Suite
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Stage Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Target Qualification Test Stage:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {stageOptions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setTargetStage(s.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    targetStage === s.id
                      ? "bg-cobalt-50 text-cobalt-700 border-cobalt-300 font-semibold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Checksum Badge */}
          {fixture && (
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-porcelain-200/60 border border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                <Hash className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold">SHA-256 Checksum:</span>
                <span className="text-slate-500 truncate max-w-xs sm:max-w-md">
                  {fixture.fixtureChecksum}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> VERIFIED
              </span>
            </div>
          )}

          {/* JSON Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Fixture Definition (JSON)</span>
              {isExporting ? (
                <span className="flex items-center gap-1 text-[11px] text-cobalt-600">
                  <Loader2 className="w-3 h-3 animate-spin" /> Synthesizing...
                </span>
              ) : (
                <span>v1.0.0</span>
              )}
            </div>
            <div className="h-60 rounded-lg bg-slate-900 text-slate-100 p-3.5 font-mono text-xs overflow-auto border border-slate-800">
              <pre>{fixtureJson || "Generating fixture..."}</pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-porcelain-100 flex items-center justify-between gap-3">
          <a
            href="/builder/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-cobalt-600 hover:text-cobalt-700 flex items-center gap-1"
          >
            <span>Open Qualification Suite</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isExporting}
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cobalt-600 hover:bg-cobalt-700 text-white transition-colors shadow-xs disabled:opacity-50"
            >
              {downloaded ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
