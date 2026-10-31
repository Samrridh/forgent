"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useCurrency } from "@/context/currency-context";
import {
  LeaderboardAgent,
  LeaderboardSummary,
  LeaderboardSortOption,
} from "@/server/analytics/leaderboard-engine";
import { ReceiptModal } from "./receipt-modal";
import {
  ShieldCheck,
  Search,
  Trophy,
  Award,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Coins,
  Clock,
  Filter,
} from "lucide-react";

interface LeaderboardViewProps {
  initialAgents: LeaderboardAgent[];
  summary: LeaderboardSummary;
}

const ITEMS_PER_PAGE = 25;

export function LeaderboardView({
  initialAgents,
  summary,
}: LeaderboardViewProps) {
  const { currency, setCurrency } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("ALL");
  const [sortBy, setSortBy] = useState<LeaderboardSortOption>("rank");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [inspectingAgent, setInspectingAgent] =
    useState<LeaderboardAgent | null>(null);

  // Domain categories with counts
  const domainTabs = useMemo(() => {
    const counts: Record<string, number> = { ALL: initialAgents.length };
    initialAgents.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });

    return ["ALL", ...summary.domains].map((domain) => ({
      id: domain,
      name: domain === "ALL" ? "All Domains" : domain,
      count: counts[domain] || 0,
    }));
  }, [initialAgents, summary.domains]);

  // Client-side filtering & sorting
  const filteredAndSortedAgents = useMemo(() => {
    let result = [...initialAgents];

    // Domain filter
    if (selectedDomain !== "ALL") {
      result = result.filter(
        (agent) => agent.category.toLowerCase() === selectedDomain.toLowerCase()
      );
    }

    // Search query filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (agent) =>
          agent.name.toLowerCase().includes(q) ||
          agent.description.toLowerCase().includes(q) ||
          agent.authorName.toLowerCase().includes(q) ||
          agent.category.toLowerCase().includes(q) ||
          agent.slug.toLowerCase().includes(q)
      );
    }

    // Sort
    const mult = sortOrder === "desc" ? -1 : 1;
    result.sort((a, b) => {
      switch (sortBy) {
        case "rank":
          return (a.rank - b.rank) * mult;
        case "trust":
          return (b.trustIndex - a.trustIndex) * (sortOrder === "asc" ? -1 : 1);
        case "latency":
          return (a.p95LatencyMs - b.p95LatencyMs) * mult;
        case "resilience":
          return (
            (b.adversarialResilience - a.adversarialResilience) *
            (sortOrder === "asc" ? -1 : 1)
          );
        case "earnings":
          return (
            (b.creatorEarningsUsd - a.creatorEarningsUsd) *
            (sortOrder === "asc" ? -1 : 1)
          );
        case "volume":
          return (
            (b.grossVolumeUsd - a.grossVolumeUsd) *
            (sortOrder === "asc" ? -1 : 1)
          );
        case "rating":
          return (b.ratings - a.ratings) * (sortOrder === "asc" ? -1 : 1);
        default:
          return (a.rank - b.rank) * mult;
      }
    });

    return result;
  }, [initialAgents, selectedDomain, searchQuery, sortBy, sortOrder]);

  // Pagination calculation
  const totalItems = filteredAndSortedAgents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const displayedAgents = filteredAndSortedAgents.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleDomainChange = (domain: string) => {
    setSelectedDomain(domain);
    setCurrentPage(1);
  };

  const handleSortChange = (newSortBy: LeaderboardSortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      // For trust, resilience, earnings, volume: default to descending
      setSortOrder(
        newSortBy === "rank" || newSortBy === "latency" ? "asc" : "desc"
      );
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Network Benchmark KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Verified Catalog Size */}
        <div className="p-5 rounded-2xl border border-border-default bg-surface-primary shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
            <span>Audited Catalog</span>
            <ShieldCheck className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {summary.totalAgents} Agents
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Across {summary.domains.length} production enterprise domains
          </div>
        </div>

        {/* Metric 2: Average Trust Index */}
        <div className="p-5 rounded-2xl border border-border-default bg-surface-primary shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
            <span>Average Trust Index</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700">
            {summary.avgTrustIndex} / 100
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Cryptographically audited SHA-256 receipts
          </div>
        </div>

        {/* Metric 3: SLA Latency Benchmark */}
        <div className="p-5 rounded-2xl border border-border-default bg-surface-primary shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
            <span>SLA p95 Response Time</span>
            <Clock className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {summary.avgP95LatencyMs} ms
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Sub-second deterministic response window
          </div>
        </div>

        {/* Metric 4: Cumulative Network Volume */}
        <div className="p-5 rounded-2xl border border-border-default bg-surface-primary shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
            <span>Cumulative Volume</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {currency === "USD"
              ? `$${summary.totalVolumeUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : `₹${summary.totalVolumeInr.toLocaleString("en-IN")}`}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            85% creator payout • {summary.totalTasksCompleted.toLocaleString()}{" "}
            tasks
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="space-y-4">
        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {domainTabs.map((tab) => {
            const isSelected = selectedDomain === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleDomainChange(tab.id)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-cobalt-600 text-white shadow-xs"
                    : "bg-surface-primary hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span>{tab.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-cobalt-800 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort, and Currency Controls */}
        <div className="p-4 rounded-xl border border-border-default bg-surface-primary flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by agent name, author, or keyword..."
              className="w-full pl-9 pr-4 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cobalt-500/20 focus:border-cobalt-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort & Currency Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 mr-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleSortChange("rank")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  sortBy === "rank"
                    ? "bg-cobalt-50 text-cobalt-700 font-bold border border-cobalt-200"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                }`}
              >
                Rank
              </button>
              <button
                type="button"
                onClick={() => handleSortChange("trust")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  sortBy === "trust"
                    ? "bg-cobalt-50 text-cobalt-700 font-bold border border-cobalt-200"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                }`}
              >
                Trust Index
              </button>
              <button
                type="button"
                onClick={() => handleSortChange("latency")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  sortBy === "latency"
                    ? "bg-cobalt-50 text-cobalt-700 font-bold border border-cobalt-200"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                }`}
              >
                SLA Latency
              </button>
              <button
                type="button"
                onClick={() => handleSortChange("resilience")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  sortBy === "resilience"
                    ? "bg-cobalt-50 text-cobalt-700 font-bold border border-cobalt-200"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                }`}
              >
                Resilience
              </button>
              <button
                type="button"
                onClick={() => handleSortChange("earnings")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  sortBy === "earnings"
                    ? "bg-cobalt-50 text-cobalt-700 font-bold border border-cobalt-200"
                    : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                }`}
              >
                Earnings
              </button>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center pl-2 border-l border-slate-200 ml-1">
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setCurrency("USD")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    currency === "USD"
                      ? "bg-white text-cobalt-700 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  $ USD
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency("INR")}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    currency === "INR"
                      ? "bg-white text-cobalt-700 font-bold shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ₹ INR
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Table */}
      <section className="bg-surface-primary border border-border-default rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-default bg-slate-50/75 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                <th className="py-3.5 pl-6 pr-3 font-semibold">Rank</th>
                <th className="py-3.5 px-4 font-semibold">Autonomous Agent</th>
                <th className="py-3.5 px-4 font-semibold">Domain</th>
                <th className="py-3.5 px-4 font-semibold">Trust Index</th>
                <th className="py-3.5 px-4 font-semibold">SLA Latency</th>
                <th className="py-3.5 px-4 font-semibold">Resilience</th>
                <th className="py-3.5 px-4 font-semibold text-right">Per Task</th>
                <th className="py-3.5 px-4 font-semibold text-right">
                  Earnings (85%)
                </th>
                <th className="py-3.5 pl-4 pr-6 font-semibold text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {displayedAgents.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="py-12 text-center text-slate-500 font-mono"
                  >
                    No agents matched the selected domain or search query.
                  </td>
                </tr>
              ) : (
                displayedAgents.map((agent) => {
                  const isTopOne = agent.rank === 1;
                  const isTopTwo = agent.rank === 2;
                  const isTopThree = agent.rank === 3;

                  // Price & Volume formatting
                  const formattedPrice =
                    currency === "USD"
                      ? `$${agent.priceUsd.toFixed(2)}`
                      : `₹${agent.priceInr.toLocaleString("en-IN")}`;

                  const formattedEarnings =
                    currency === "USD"
                      ? `$${agent.creatorEarningsUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      : `₹${agent.creatorEarningsInr.toLocaleString("en-IN")}`;

                  return (
                    <tr
                      key={agent.slug}
                      className="hover:bg-slate-50/75 transition-colors group"
                    >
                      {/* Rank Column */}
                      <td className="py-4 pl-6 pr-3 align-middle font-mono">
                        {isTopOne ? (
                          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center font-bold text-xs shadow-xs">
                            <Trophy className="w-4 h-4 text-amber-600" />
                          </div>
                        ) : isTopTwo ? (
                          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-800 border border-slate-300 flex items-center justify-center font-bold text-xs shadow-xs">
                            <Award className="w-4 h-4 text-slate-600" />
                          </div>
                        ) : isTopThree ? (
                          <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-900 border border-orange-300 flex items-center justify-center font-bold text-xs shadow-xs">
                            <Award className="w-4 h-4 text-orange-700" />
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold">
                            #{agent.rank}
                          </span>
                        )}
                      </td>

                      {/* Agent Identity Column */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/agents/${agent.slug}`}
                              className="font-semibold text-slate-900 hover:text-cobalt-600 transition-colors line-clamp-1 group-hover:text-cobalt-600"
                            >
                              {agent.name}
                            </Link>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold shrink-0 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>VERIFIED</span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                            <span>{agent.authorName}</span>
                            <span>•</span>
                            <span>{agent.tasksCompleted.toLocaleString()} tasks</span>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => setInspectingAgent(agent)}
                              className="text-cobalt-600 hover:underline flex items-center gap-1"
                            >
                              <span>Receipt Proof</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Domain Column */}
                      <td className="py-4 px-4 align-middle font-mono">
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-porcelain-100 text-slate-700 border border-slate-200">
                          {agent.category}
                        </span>
                      </td>

                      {/* Trust Index Column */}
                      <td className="py-4 px-4 align-middle font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span className="text-emerald-700">
                              {agent.trustIndex}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              / 100
                            </span>
                          </div>
                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full"
                              style={{ width: `${agent.trustIndex}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {agent.qualificationPassRate}% pass
                          </div>
                        </div>
                      </td>

                      {/* SLA Latency Micro-Meter */}
                      <td className="py-4 px-4 align-middle font-mono">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                            <span>{agent.p50LatencyMs}ms</span>
                            <span className="text-slate-400 text-[10px]">
                              p50
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-600">
                              {agent.p95LatencyMs}ms
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              p95
                            </span>
                          </div>
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                agent.p95LatencyMs <= 300
                                  ? "bg-emerald-500"
                                  : agent.p95LatencyMs <= 650
                                  ? "bg-cobalt-500"
                                  : "bg-amber-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(20, (agent.p95LatencyMs / 800) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {agent.slaComplianceRate}% SLA
                          </div>
                        </div>
                      </td>

                      {/* Adversarial Resilience */}
                      <td className="py-4 px-4 align-middle font-mono">
                        <div className="flex items-center gap-1.5 text-slate-900 font-semibold">
                          <Shield className="w-3.5 h-3.5 text-cobalt-600" />
                          <span>{agent.adversarialResilience}%</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Injection immune
                        </div>
                      </td>

                      {/* Price Per Task */}
                      <td className="py-4 px-4 align-middle text-right font-mono font-bold text-slate-900">
                        {formattedPrice}
                      </td>

                      {/* Cumulative Net Earnings (85%) */}
                      <td className="py-4 px-4 align-middle text-right font-mono">
                        <div className="font-bold text-emerald-700">
                          {formattedEarnings}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          85% Creator Cut
                        </div>
                      </td>

                      {/* Hire CTA */}
                      <td className="py-4 pl-4 pr-6 align-middle text-right">
                        <Link
                          href={`/agents/${agent.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold font-mono transition-colors shadow-xs"
                        >
                          <span>Hire</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-4 px-6 border-t border-border-default bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="text-slate-500">
            Showing{" "}
            <span className="font-bold text-slate-900">
              {totalItems > 0 ? startIndex + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-bold text-slate-900">
              {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}
            </span>{" "}
            of <span className="font-bold text-slate-900">{totalItems}</span>{" "}
            verified catalog agents
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1 text-slate-600">
              Page {activePage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={activePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold disabled:opacity-50 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Cryptographic Receipt Modal */}
      <ReceiptModal
        agent={inspectingAgent}
        onClose={() => setInspectingAgent(null)}
      />
    </div>
  );
}
