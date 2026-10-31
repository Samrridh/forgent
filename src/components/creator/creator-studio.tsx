"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CreatorAgent } from "./creator-types";
import { INITIAL_CREATOR_AGENTS } from "./creator-data";
import { MyAgentsTab } from "./my-agents-tab";
import { PublishWizard } from "./publish-wizard/publish-wizard";
import { EarningsCenter } from "./earnings/earnings-center";
import { CreatorAnalyticsTab } from "./analytics/creator-analytics-tab";
import { BuilderWorkspace } from "@/components/builder/builder-workspace";
import {
  Boxes,
  PlusCircle,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  BarChart3,
  ClipboardCheck,
  UserRound,
} from "lucide-react";

export type CreatorStudioTab = "my-agents" | "analytics" | "publish" | "earnings" | "package-review" | "profile";

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
          <p className="text-sm text-slate-600">Demo workspace: existing agent statistics and verification results are illustrative. Package review inspects source without executing it.</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-200">
              Creator Studio Demo
            </span>
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Builder Workspace
            </span>
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Static Review Available</span>
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Agent Creator Studio &amp; Payout Center
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Explore the builder workflow, describe an agent, and request a static package review. Statistics and payouts are illustrative.
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
            <button type="button" onClick={() => setActiveTab("package-review")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors shrink-0 ${activeTab === "package-review" ? "bg-cobalt-500 text-white shadow-xs" : "bg-surface-primary hover:bg-slate-100 text-slate-700 border border-slate-200"}`}>
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Package Review</span>
            </button>
            <button type="button" onClick={() => setActiveTab("profile")} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-colors shrink-0 ${activeTab === "profile" ? "bg-cobalt-500 text-white shadow-xs" : "bg-surface-primary hover:bg-slate-100 text-slate-700 border border-slate-200"}`}>
              <UserRound className="w-3.5 h-3.5" />
              <span>Profile</span>
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
        <div hidden={activeTab !== "package-review"}><BuilderWorkspace embedded /></div>
        {activeTab === "profile" && <section className="business-panel"><p className="business-kicker">BUILDER / PROFILE</p><h2>Demo builder</h2><p>This is a shared demo profile. Agent submissions, reviews, and account statistics are not saved.</p><p>Published agents: unavailable · Evaluations: unavailable</p></section>}
      </main>
    </div>
  );
}
