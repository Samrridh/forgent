"use client";

import React from "react";
import { StarterTemplate } from "@/server/templates/template-definitions";
import { useCurrency } from "@/context/currency-context";
import {
  Code,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Boxes,
} from "lucide-react";

interface TemplateCardProps {
  template: StarterTemplate;
  onInspect: (template: StarterTemplate) => void;
  onDownload: (id: string) => void;
  isDownloading: boolean;
}

export function TemplateCard({
  template,
  onInspect,
  onDownload,
  isDownloading,
}: TemplateCardProps) {
  const { currency } = useCurrency();

  const formattedPrice =
    currency === "USD"
      ? `$${template.pricingUsd.toFixed(2)}`
      : `₹${template.pricingInr.toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col bg-surface-primary border border-border-default rounded-xl overflow-hidden hover:border-cobalt-400 transition-all shadow-sm hover:shadow-md">
      {/* Top Banner & Category */}
      <div className="p-6 pb-4 border-b border-border-subtle bg-gradient-to-b from-porcelain-100 to-surface-primary">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase font-semibold bg-cobalt-50 text-cobalt-700 border border-cobalt-200">
            <Boxes className="w-3 h-3 text-cobalt-600" />
            {template.category}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200">
              {formattedPrice} / task
            </span>
          </div>
        </div>

        <h3 className="text-lg font-bold tracking-tight text-slate-900">
          {template.title}
        </h3>
        <p className="text-xs font-medium text-cobalt-600 mt-1 font-mono">
          {template.tagline}
        </p>
        <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
          {template.description}
        </p>
      </div>

      {/* Specifications Grid */}
      <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-porcelain-50 border-b border-border-subtle text-center">
        <div>
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-500 uppercase">
            <Clock className="w-3 h-3" />
            Latency
          </div>
          <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
            {template.latencyTarget}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-500 uppercase">
            <ShieldCheck className="w-3 h-3" />
            Success
          </div>
          <div className="text-xs font-mono font-bold text-emerald-700 mt-0.5">
            {template.successRate}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-500 uppercase">
            <FileText className="w-3 h-3" />
            Files
          </div>
          <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
            5 Modules
          </div>
        </div>
      </div>

      {/* Capabilities List */}
      <div className="flex-1 p-6 space-y-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
            Contract Guarantees
          </div>
          <ul className="space-y-1.5">
            {template.capabilities.map((cap, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-snug">
                <CheckCircle2 className="w-3.5 h-3.5 text-cobalt-600 shrink-0 mt-0.5" />
                <span>{cap}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Files Included Tagline */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
            Package Contents
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(template.files).map((filename) => (
              <span
                key={filename}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
              >
                {filename}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 border-t border-border-subtle bg-white flex items-center gap-2">
        <button
          type="button"
          onClick={() => onInspect(template)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
        >
          <Code className="w-3.5 h-3.5 text-slate-500" />
          <span>Inspect Code</span>
        </button>

        <button
          type="button"
          onClick={() => onDownload(template.id)}
          disabled={isDownloading}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
        >
          <ArrowDownToLine className="w-3.5 h-3.5" />
          <span>{isDownloading ? "Packaging..." : "Download ZIP"}</span>
        </button>
      </div>
    </div>
  );
}
