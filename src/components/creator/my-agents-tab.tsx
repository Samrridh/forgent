"use client";

import React, { useState, useMemo } from "react";
import { CreatorAgent } from "./creator-types";
import { useCurrency } from "@/context/currency-context";
import {
  Boxes,
  Activity,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  Plus,
  Play,
  Pause,
  Table as TableIcon,
  LayoutGrid,
  ShieldCheck,
} from "lucide-react";

interface MyAgentsTabProps {
  agents: CreatorAgent[];
  onToggleStatus: (agentId: string) => void;
  onOpenPublishWizard: () => void;
}

export function MyAgentsTab({
  agents,
  onToggleStatus,
  onOpenPublishWizard,
}: MyAgentsTabProps) {
  const { currency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "PAUSED">("ALL");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Summary computations
  const totalTasks30d = useMemo(
    () => agents.reduce((acc, a) => acc + a.taskVolume30d, 0),
    [agents]
  );
  const totalEarningsUsd = useMemo(
    () => agents.reduce((acc, a) => acc + a.earnings30dUsd, 0),
    [agents]
  );
  const avgLatency = useMemo(() => {
    if (agents.length === 0) return 0;
    return Math.round(agents.reduce((acc, a) => acc + a.avgLatencyMs, 0) / agents.length);
  }, [agents]);
  const avgSuccessRate = useMemo(() => {
    if (agents.length === 0) return 0;
    const sum = agents.reduce((acc, a) => acc + a.successRate, 0);
    return (sum / agents.length).toFixed(2);
  }, [agents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesStatus =
        statusFilter === "ALL" || agent.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.bio.toLowerCase().includes(q) ||
        agent.category.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [agents, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Aggregated Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-border-default bg-surface-primary">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>30-Day Task Volume</span>
            <Activity className="w-4 h-4 text-cobalt-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {totalTasks30d.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {agents.length} active agent deployments
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border-default bg-surface-primary">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>Mean Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
            {avgSuccessRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Deterministic assertion pass rate
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border-default bg-surface-primary">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>Average Latency</span>
            <Clock className="w-4 h-4 text-azure-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {avgLatency}ms
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            99th percentile response envelope
          </p>
        </div>

        <div className="p-5 rounded-xl border border-border-default bg-surface-primary">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>30-Day Net Earnings (85%)</span>
            <TrendingUp className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-cobalt-600 mt-2">
            {currency === "USD"
              ? `$${totalEarningsUsd.toFixed(2)}`
              : `₹${Math.round(totalEarningsUsd * 80).toLocaleString("en-IN")}`}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Directly withdrawable upon settlement
          </p>
        </div>
      </div>

      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-xl border border-border-default bg-surface-primary">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name or category..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-porcelain-50 text-xs text-foreground placeholder:text-slate-400 focus:outline-none focus:border-cobalt-500"
            />
          </div>

          {/* Status Segment Filter */}
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 bg-porcelain-100 text-xs font-mono">
            {(["ALL", "ACTIVE", "PAUSED"] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === status
                    ? "bg-white text-cobalt-700 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg border border-slate-200 bg-porcelain-100">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-white text-cobalt-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-cobalt-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenPublishWizard}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Publish New Agent</span>
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" ? (
        <div className="border border-border-default rounded-xl bg-surface-primary overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle bg-porcelain-100 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Agent &amp; Version</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold text-right">Task Volume</th>
                  <th className="py-3 px-4 font-semibold text-right">Success Rate</th>
                  <th className="py-3 px-4 font-semibold text-right">Avg Latency</th>
                  <th className="py-3 px-4 font-semibold text-right">30d Revenue</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle text-xs">
                {filteredAgents.map((agent) => {
                  const priceStr =
                    currency === "USD"
                      ? `$${agent.earnings30dUsd.toFixed(2)}`
                      : `₹${agent.earnings30dInr.toLocaleString("en-IN")}`;

                  return (
                    <tr key={agent.id} className="hover:bg-porcelain-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-cobalt-50 border border-cobalt-200 text-cobalt-600 flex items-center justify-center shrink-0">
                            <Boxes className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{agent.name}</span>
                              {agent.verified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-cobalt-600" />
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {agent.version} &bull; {agent.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {agent.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                        {agent.taskVolume30d.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                        {agent.successRate.toFixed(2)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                        {agent.avgLatencyMs}ms
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-cobalt-600">
                        {priceStr}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(agent.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium transition-colors ${
                            agent.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              agent.status === "ACTIVE" ? "bg-emerald-600" : "bg-amber-600"
                            }`}
                          />
                          <span>{agent.status}</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleStatus(agent.id)}
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                            title={agent.status === "ACTIVE" ? "Pause Agent" : "Activate Agent"}
                            aria-label={agent.status === "ACTIVE" ? "Pause Agent" : "Activate Agent"}
                          >
                            {agent.status === "ACTIVE" ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const priceStr =
              currency === "USD"
                ? `$${agent.earnings30dUsd.toFixed(2)}`
                : `₹${agent.earnings30dInr.toLocaleString("en-IN")}`;

            return (
              <div
                key={agent.id}
                className="p-5 rounded-xl border border-border-default bg-surface-primary space-y-4 hover:border-cobalt-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-cobalt-50 border border-cobalt-200 text-cobalt-600 flex items-center justify-center">
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 leading-snug">
                        {agent.name}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">
                        {agent.version} &bull; {agent.category}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(agent.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                      agent.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {agent.status}
                  </button>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {agent.bio}
                </p>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-border-subtle bg-porcelain-50 rounded text-center">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Volume
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {agent.taskVolume30d}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Success
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {agent.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block uppercase">
                      Latency
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {agent.avgLatencyMs}ms
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">
                      30d Earnings
                    </span>
                    <span className="text-sm font-mono font-bold text-cobalt-600">
                      {priceStr}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(agent.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-mono text-slate-700 transition-colors"
                  >
                    {agent.status === "ACTIVE" ? (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredAgents.length === 0 && (
        <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 bg-surface-primary space-y-3">
          <Boxes className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800">No agents match criteria</h3>
          <p className="text-xs text-slate-500">
            Clear filters or publish your first verified agent package.
          </p>
          <button
            type="button"
            onClick={onOpenPublishWizard}
            className="px-4 py-2 rounded-lg bg-cobalt-500 text-white text-xs font-semibold"
          >
            Open Publish Wizard
          </button>
        </div>
      )}
    </div>
  );
}
