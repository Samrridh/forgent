"use client";

import React, { useState } from "react";
import { X, Sparkles, Wand2, Layers } from "lucide-react";
import { EnterprisePipeline } from "@/lib/contracts/enterprise-types";
import { generateCustomWorkflowFromPrompt } from "@/data/enterprise-data";

interface CustomWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWorkflowGenerated: (pipeline: EnterprisePipeline) => void;
}

const PRESET_IDEAS = [
  {
    title: "Healthcare BAA Contract Risk & HIPAA Compliance",
    category: "Legal",
  },
  {
    title: "Multi-Cloud FinOps Reserved Instance Sweeper",
    category: "Engineering",
  },
  {
    title: "AML & Sanctions Screening Onboarding Pipeline",
    category: "Finance",
  },
  {
    title: "Global Payroll Variance & Tax Withholding Reconciler",
    category: "Finance",
  },
];

export function CustomWorkflowModal({
  isOpen,
  onClose,
  onWorkflowGenerated,
}: CustomWorkflowModalProps) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("Finance");
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    setTimeout(() => {
      const newPipeline = generateCustomWorkflowFromPrompt(prompt, category);
      setIsGenerating(false);
      onWorkflowGenerated(newPipeline);
      onClose();
    }, 600);
  };

  const handleSelectPreset = (title: string, cat: string) => {
    setPrompt(title);
    setCategory(cat);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cobalt-50 text-cobalt-600 border border-cobalt-200 flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                On-Demand Workflow Generator
              </h2>
              <p className="text-xs text-slate-500">
                Auto-construct a deterministic 3-stage DAG pipeline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Workflow Objective &amp; Requirements
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Automatically parse supplier invoices, cross-check against PO item quantities in ERP, and commit cryptographically signed receipt to SOX ledger."
              rows={3}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-cobalt-500 focus:border-cobalt-500 text-slate-800 placeholder-slate-400 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Department Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-cobalt-500"
            >
              <option value="Finance">Finance &amp; Treasury</option>
              <option value="Legal">Legal &amp; Contracts</option>
              <option value="Security">Security &amp; Compliance</option>
              <option value="Engineering">Engineering &amp; Platform Ops</option>
              <option value="Operations">Operations &amp; Logistics</option>
            </select>
          </div>

          <div>
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Preset Enterprise Blueprints
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_IDEAS.map((idea) => (
                <button
                  key={idea.title}
                  type="button"
                  onClick={() => handleSelectPreset(idea.title, idea.category)}
                  className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-cobalt-300 hover:bg-cobalt-50/50 transition-colors group"
                >
                  <div className="text-xs font-medium text-slate-800 group-hover:text-cobalt-700 line-clamp-1">
                    {idea.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {idea.category}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-porcelain-100 rounded-lg border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
            <Layers className="w-4 h-4 text-cobalt-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800">
                Automated 3-Stage DAG Construction:
              </span>{" "}
              Creates Step 1 (Input &amp; Ingestion), Step 2 (Processing &amp; Rules), and Step 3 (Synthesis &amp; Verification) with live parameter bindings.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!prompt.trim() || isGenerating}
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-xs disabled:opacity-50 transition-colors"
          >
            {isGenerating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Assembling DAG...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Workflow</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
