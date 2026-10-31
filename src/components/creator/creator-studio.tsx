"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CreatorAgent } from "./creator-types";
import { INITIAL_CREATOR_AGENTS } from "./creator-data";
import { MyAgentsTab } from "./my-agents-tab";
import { PublishWizard } from "./publish-wizard/publish-wizard";
import { EarningsCenter } from "./earnings/earnings-center";
import { CreatorAnalyticsTab } from "./analytics/creator-analytics-tab";
import {
  Boxes,
  PlusCircle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  BarChart3,
} from "lucide-react";

export type CreatorStudioTab = "my-agents" | "analytics" | "publish" | "earnings";

interface CreatorStudioProps {
  initialTab?: CreatorStudioTab;
}

export function CreatorStudio({ initialTab = "my-agents" }: CreatorStudioProps) {
  const [activeTab, setActiveTab] = useState<CreatorStudioTab>(initialTab);
  const [agents, setAgents] = useState<CreatorAgent[]>(INITIAL_CREATOR_AGENTS);
  const [publishedSuccessMsg, setPublishedSuccessMsg] = useState<string | null>(null);

  const handleToggleStatus = (agentId: string) => {
    setAgents((prev) =>
      prev.map((agent) => {
        if (agent.id === agentId) {
          const nextStatus = agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
          return { ...agent, status: nextStatus };
        }
        return agent;
      })
    );
  };

  const handlePublishAgent = (newAgent: CreatorAgent) => {
    setAgents((prev) => [newAgent, ...prev]);
    setActiveTab("my-agents");
    setPublishedSuccessMsg(`Published and verified "${newAgent.name}" on the Forgent network.`);
    setTimeout(() => setPublishedSuccessMsg(null), 5000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner / Hero Header */}
      <section className="border-b border-border-default bg-surface-primary py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-200">
              Verified Creator Studio
            </span>
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Builder Workspace
            </span>
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Verification Harness Ready</span>
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Agent Creator Studio &amp; Payout Center
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Deploy, verify, and monetize deterministic autonomous agents. Configure task contracts, run the 5-test verification suite, and withdraw revenue via instant UPI, Bank Wire, or Stripe.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/templates"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <FileCode className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Templates Hub</span>
              </Link>
              {activeTab !== "publish" && (
                <button
                  type="button"
                  onClick={() => setActiveTab("publish")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Publish Agent</span>
                </button>
              )}
            </div>
          </div>

          {/* Success Alert Banner */}
          {publishedSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{publishedSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setPublishedSuccessMsg(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 4 Primary Navigation Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-border-subtle overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("my-agents")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors shrink-0 ${
                activeTab === "my-agents"
                  ? "bg-cobalt-500 text-white shadow-xs"
                  : "bg-surface-primary hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>My Published Agents ({agents.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors shrink-0 ${
                activeTab === "analytics"
                  ? "bg-cobalt-500 text-white shadow-xs"
                  : "bg-surface-primary hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Revenue &amp; Token Analytics</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("earnings")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors shrink-0 ${
                activeTab === "earnings"
                  ? "bg-cobalt-500 text-white shadow-xs"
                  : "bg-surface-primary hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Earnings &amp; Payout Center</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("publish")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors shrink-0 ${
                activeTab === "publish"
                  ? "bg-cobalt-500 text-white shadow-xs"
                  : "bg-surface-primary hover:bg-slate-100 text-slate-700 border border-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Publish Agent Wizard</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Tab View Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "my-agents" && (
          <MyAgentsTab
            agents={agents}
            onToggleStatus={handleToggleStatus}
            onOpenPublishWizard={() => setActiveTab("publish")}
          />
        )}

        {activeTab === "analytics" && <CreatorAnalyticsTab />}

        {activeTab === "publish" && (
          <PublishWizard
            onPublishAgent={handlePublishAgent}
            onCancel={() => setActiveTab("my-agents")}
          />
        )}

        {activeTab === "earnings" && <EarningsCenter />}
      </main>
    </div>
  );
}
