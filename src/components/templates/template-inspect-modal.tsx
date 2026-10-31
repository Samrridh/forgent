"use client";

import React, { useState } from "react";
import { StarterTemplate } from "@/server/templates/template-definitions";
import { X, Copy, Check, FileCode, ArrowDownToLine } from "lucide-react";

interface TemplateInspectModalProps {
  template: StarterTemplate;
  onClose: () => void;
  onDownload: (id: string) => void;
  isDownloading: boolean;
}

export function TemplateInspectModal({
  template,
  onClose,
  onDownload,
  isDownloading,
}: TemplateInspectModalProps) {
  const [activeTab, setActiveTab] = useState<"code" | "input" | "output" | "readme">("code");
  const [copied, setCopied] = useState(false);

  const getActiveContent = (): string => {
    switch (activeTab) {
      case "code":
        return template.files["src/index.ts"] || "";
      case "input":
        return template.inputSchemaSample;
      case "output":
        return template.outputSchemaSample;
      case "readme":
        return template.files["README.md"] || "";
      default:
        return "";
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getActiveContent());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[90vh] bg-surface-primary border border-border-default rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border-default flex items-center justify-between bg-porcelain-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cobalt-500 text-white flex items-center justify-center shadow-sm">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">{template.title}</h3>
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-cobalt-100 text-cobalt-800 border border-cobalt-200">
                  {template.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{template.tagline}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Copy Action */}
        <div className="px-6 py-2.5 border-b border-border-subtle bg-white flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                activeTab === "code"
                  ? "bg-cobalt-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              src/index.ts
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("input")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                activeTab === "input"
                  ? "bg-cobalt-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Input Contract (JSON)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("output")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                activeTab === "output"
                  ? "bg-cobalt-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Output Deliverable (JSON)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("readme")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-colors ${
                activeTab === "readme"
                  ? "bg-cobalt-500 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              README.md
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono text-slate-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Content Area */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed">
          <pre className="whitespace-pre">
            <code>{getActiveContent()}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border-default bg-porcelain-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            Package contains 5 files (package.json, tsconfig.json, src/index.ts, .env.example, README.md)
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onDownload(template.id)}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>{isDownloading ? "Packaging Archive..." : "Download Starter (.ZIP)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
