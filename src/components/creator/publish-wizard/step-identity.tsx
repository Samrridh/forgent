"use client";

import React from "react";
import { AGENT_CATEGORIES, AgentCategory } from "@/types/agent";
import { PublishWizardForm } from "../creator-types";
import {
  Boxes,
  ShieldCheck,
  Scale,
  Cpu,
  FileCheck,
  Landmark,
  Search,
  Network,
  Binary,
  Workflow,
} from "lucide-react";

interface StepIdentityProps {
  formData: PublishWizardForm;
  onChange: (fields: Partial<PublishWizardForm>) => void;
}

const AVATAR_OPTIONS = [
  { id: "Boxes", label: "General", icon: Boxes },
  { id: "Landmark", label: "Finance", icon: Landmark },
  { id: "Scale", label: "Legal", icon: Scale },
  { id: "ShieldCheck", label: "Security", icon: ShieldCheck },
  { id: "Cpu", label: "DevOps", icon: Cpu },
  { id: "FileCheck", label: "Audit", icon: FileCheck },
  { id: "Search", label: "Research", icon: Search },
  { id: "Network", label: "Routing", icon: Network },
  { id: "Binary", label: "Data", icon: Binary },
  { id: "Workflow", label: "Operations", icon: Workflow },
];

export function StepIdentity({ formData, onChange }: StepIdentityProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border-subtle pb-4">
        <h3 className="text-base font-bold text-slate-900">Step 1: Agent Identity &amp; Profile</h3>
        <p className="text-xs text-slate-500 mt-1">
          Define the canonical name, operational industry category, and functional brief for this agent.
        </p>
      </div>

      <div className="space-y-4">
        {/* Agent Name */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Agent Title *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Cross-Border VAT &amp; GST Reconciliation Specialist"
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cobalt-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Use a descriptive technical title explaining the exact task performed.
          </p>
        </div>

        {/* Industry Category */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Operational Domain / Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => onChange({ category: e.target.value as AgentCategory })}
            className="w-full px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-cobalt-500"
          >
            {AGENT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Avatar Icon Selection */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Monochrome SVG Icon Badge *
          </label>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {AVATAR_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = formData.avatarIcon === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange({ avatarIcon: opt.id })}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                    isSelected
                      ? "border-cobalt-500 bg-cobalt-50 text-cobalt-700 shadow-xs"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                  }`}
                  title={opt.label}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-mono mt-1 truncate max-w-full">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bio Description */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Technical Bio &amp; Functional Scope *
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => onChange({ bio: e.target.value })}
            rows={4}
            placeholder="Describe the agent's deterministic invariants, execution model, input/output validation rules, and error handling capabilities in plain technical language..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-cobalt-500 leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
            <span>Minimum 20 characters</span>
            <span className={formData.bio.length >= 20 ? "text-emerald-600" : "text-amber-600"}>
              {formData.bio.length} chars
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
