"use client";

import React, { useState, useMemo } from "react";
import { useCurrency } from "@/context/currency-context";
import {
  getCreatorAnalyticsTelemetry,
  CreatorAnalyticsTelemetry,
  EarningsVelocityPoint,
} from "@/server/analytics/creator-analytics-engine";
import {
  TrendingUp,
  Cpu,
  Coins,
  CheckCircle2,
  Clock,
  Receipt,
  Copy,
  Check,
  Building,
  CreditCard,
} from "lucide-react";

export function CreatorAnalyticsTab() {
  const { currency } = useCurrency();
  const [timeframe, setTimeframe] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [copiedTxHash, setCopiedTxHash] = useState<string | null>(null);

  // Load telemetry data from the engine
  const telemetry: CreatorAnalyticsTelemetry = useMemo(() => {
    return getCreatorAnalyticsTelemetry({ timeframe });
  }, [timeframe]);

  const { summary, velocity, tokenMargins, payouts, topAgents } = telemetry;

  // Selected or active daily velocity point
  const activeVelocityPoint: EarningsVelocityPoint = useMemo(() => {
    if (
      selectedPointIndex !== null &&
      velocity.points[selectedPointIndex]
    ) {
      return velocity.points[selectedPointIndex];
    }
    return velocity.points[velocity.points.length - 1];
  }, [selectedPointIndex, velocity.points]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedTxHash(hash);
    setTimeout(() => setCopiedTxHash(null), 2000);
  };

  // Helper formatters
  const formatMoney = (usd: number, inr: number) => {
    if (currency === "USD") {
      return `$${usd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${inr.toLocaleString("en-IN")}`;
  };

  const maxDailyGross = useMemo(() => {
    return Math.max(...velocity.points.map((p) => p.grossGmvUsd), 1);
  }, [velocity.points]);

  return (
    <div className="space-y-8">
      {/* 4 Header KPI Telemetry Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross GMV */}
        <div className="p-5 rounded-2xl border border-border-default bg-surface-primary space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
            <span>Gross Network GMV</span>
            <Coins className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900">
            {formatMoney(summary.grossGmvUsd, summary.grossGmvInr)}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {summary.totalTasksCompleted.toLocaleString()} total tasks executed
          </div>
        </div>

        {/* 85% Net Creator Earnings */}
        <div className="p-5 rounded-2xl border border-border-default bg-surface-primary space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
            <span>Net Creator Payout (85%)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700">
            {formatMoney(summary.netEarningsUsd, summary.netEarningsInr)}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Directly withdrawable via UPI / Wire
          </div>
        </div>

        {/* 15% Platform Fee Deduction */}
        <div className="p-5 rounded-2xl border border-border-default bg-surface-primary space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
            <span>Forgent Network Fee (15%)</span>
            <Receipt className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-700">
            {formatMoney(summary.platformFeeUsd, summary.platformFeeInr)}
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Harness runtime &amp; cryptographic escrow
          </div>
        </div>

        {/* Token Cost Margin Efficiency */}
        <div className="p-5 rounded-2xl border border-border-default bg-surface-primary space-y-2">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-slate-500">
            <span>Token Margin Efficiency</span>
            <Cpu className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-cobalt-700">
            {tokenMargins.grossMarginPercent}%
          </div>
          <div className="text-xs text-slate-500 font-mono">
            {tokenMargins.promptCachingHitRatePercent}% cache hit rate
          </div>
        </div>
      </section>

      {/* Visual Earnings Velocity Section */}
      <section className="p-6 rounded-2xl border border-border-default bg-surface-primary space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Earnings Velocity &amp; Execution Volume
              </h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                +{velocity.velocity7dGrowthPercent}% vs prev 7d
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Daily task completion velocity and 85% creator revenue trajectory over 30 days
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 font-mono text-xs">
            {(["7d", "30d", "90d", "all"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-md transition-colors uppercase ${
                  timeframe === tf
                    ? "bg-white text-cobalt-700 font-bold shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Day Telemetry Sub-Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Selected Date:</span>
            <span className="font-bold text-slate-900">
              {activeVelocityPoint.date} ({activeVelocityPoint.dayLabel})
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-500">Tasks: </span>
              <span className="font-bold text-slate-900">
                {activeVelocityPoint.tasksCompleted}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Gross GMV: </span>
              <span className="font-bold text-slate-900">
                {formatMoney(
                  activeVelocityPoint.grossGmvUsd,
                  activeVelocityPoint.grossGmvInr
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Creator Net (85%): </span>
              <span className="font-bold text-emerald-700">
                {formatMoney(
                  activeVelocityPoint.netEarningsUsd,
                  activeVelocityPoint.netEarningsInr
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Token Cost: </span>
              <span className="font-bold text-slate-600">
                {formatMoney(
                  activeVelocityPoint.tokenCostUsd,
                  activeVelocityPoint.tokenCostInr
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Velocity Bar Chart */}
        <div className="space-y-2">
          <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-4 px-1 border-b border-slate-200">
            {velocity.points.map((point, index) => {
              const heightPercent = Math.max(
                8,
                Math.round((point.grossGmvUsd / maxDailyGross) * 100)
              );
              const isSelected =
                selectedPointIndex === index ||
                (selectedPointIndex === null && index === velocity.points.length - 1);

              return (
                <div
                  key={point.date}
                  className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer relative"
                  onClick={() => setSelectedPointIndex(index)}
                >
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-white font-mono text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                    {point.dayLabel}: {formatMoney(point.netEarningsUsd, point.netEarningsInr)}
                  </div>

                  {/* Vertical Velocity Bar */}
                  <div
                    className={`w-full rounded-t transition-all ${
                      isSelected
                        ? "bg-cobalt-600 ring-2 ring-cobalt-300 shadow-xs"
                        : "bg-cobalt-200 hover:bg-cobalt-400"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Timeline Labels */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
            <span>{velocity.points[0]?.dayLabel}</span>
            <span>{velocity.points[Math.floor(velocity.points.length / 2)]?.dayLabel}</span>
            <span>{velocity.points[velocity.points.length - 1]?.dayLabel}</span>
          </div>
        </div>
      </section>

      {/* Two Column Section: Token Margin Efficiency & Top-Earning Agents */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Token Cost Margins Deep-Dive */}
        <div className="p-6 rounded-2xl border border-border-default bg-surface-primary space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Token Margin Efficiency
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Inference cost margins and prompt cache hit rate across task runs
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-porcelain-100 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase text-slate-500">
                Processed Tokens
              </span>
              <div className="text-lg font-bold text-slate-900">
                {(tokenMargins.totalTokensProcessed / 1000000).toFixed(2)}M Tokens
              </div>
              <div className="text-[10px] text-slate-500">
                ~{tokenMargins.avgTokensPerExecution} tokens/task
              </div>
            </div>

            <div className="p-4 rounded-xl bg-porcelain-100 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase text-slate-500">
                Blended Token Cost
              </span>
              <div className="text-lg font-bold text-slate-900">
                ${tokenMargins.blendedCostPer1kTokensUsd} / 1k
              </div>
              <div className="text-[10px] text-slate-500">
                ₹{tokenMargins.blendedCostPer1kTokensInr} / 1k
              </div>
            </div>

            <div className="p-4 rounded-xl bg-porcelain-100 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase text-slate-500">
                Total Compute Expense
              </span>
              <div className="text-lg font-bold text-slate-700">
                {formatMoney(
                  tokenMargins.totalTokenCostUsd,
                  tokenMargins.totalTokenCostInr
                )}
              </div>
              <div className="text-[10px] text-slate-500">
                Across {summary.totalTasksCompleted} executions
              </div>
            </div>

            <div className="p-4 rounded-xl bg-porcelain-100 border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase text-slate-500">
                Prompt Cache Hit Rate
              </span>
              <div className="text-lg font-bold text-emerald-700">
                {tokenMargins.promptCachingHitRatePercent}%
              </div>
              <div className="text-[10px] text-slate-500">
                Reduced latency &amp; cost
              </div>
            </div>
          </div>

          {/* Execution Architecture Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 font-mono text-xs">
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">
              Runtime Architecture Split
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-700">
                <span>LLM-Assisted Inference</span>
                <span className="font-bold">{tokenMargins.llmAssistedRatioPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cobalt-600 h-2 rounded-full"
                  style={{ width: `${tokenMargins.llmAssistedRatioPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-slate-700 pt-1">
                <span>Deterministic Zero-Cost Logic</span>
                <span className="font-bold">{tokenMargins.deterministicRatioPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full"
                  style={{ width: `${tokenMargins.deterministicRatioPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top-Earning Agents Breakdown */}
        <div className="p-6 rounded-2xl border border-border-default bg-surface-primary space-y-6">
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Top-Earning Agent Breakdown
            </h2>
            <p className="text-xs text-slate-500 font-mono">
              Volume, margin, and 85% creator payout per published agent
            </p>
          </div>

          <div className="space-y-3">
            {topAgents.map((agent) => (
              <div
                key={agent.id}
                className="p-4 rounded-xl border border-slate-200 bg-porcelain-100 hover:border-slate-300 transition-colors space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-xs">
                      {agent.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200">
                        {agent.category}
                      </span>
                      <span>•</span>
                      <span>{agent.taskVolume30d} tasks</span>
                      <span>•</span>
                      <span>{agent.avgLatencyMs}ms SLA</span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-emerald-700">
                      {formatMoney(agent.netEarningsUsd, agent.netEarningsInr)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {agent.marginPercent}% Net Margin
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-200/80 text-slate-600">
                  <span>Gross GMV: {formatMoney(agent.grossGmvUsd, agent.grossGmvInr)}</span>
                  <span>15% Fee: {formatMoney(agent.platformFeeUsd, agent.platformFeeInr)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Payout Audit Ledger (Verified Rails History) */}
      <section className="p-6 rounded-2xl border border-border-default bg-surface-primary space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-slate-900">
              Payout Audit Ledger &amp; Dual-Rail Settlements
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Verified settlement records across UPI Instant, Bank Wire, and Stripe Connect rails
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-500">Settled:</span>
            <span className="font-bold text-slate-900">
              {formatMoney(payouts.totalSettledUsd, payouts.totalSettledInr)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">In Escrow:</span>
            <span className="font-bold text-amber-700">
              {formatMoney(payouts.totalPendingUsd, payouts.totalPendingInr)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-border-default rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-default bg-slate-50 text-[11px] font-mono uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4 font-semibold">Rail &amp; Method</th>
                <th className="py-3 px-4 font-semibold">Destination Account</th>
                <th className="py-3 px-4 font-semibold">Transaction &amp; Receipt</th>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono">
              {[...payouts.activeRequests, ...payouts.settledHistory].map((item) => {
                const isCopied = copiedTxHash === item.settlementReceiptHash;

                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-2">
                        {item.method === "UPI" ? (
                          <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                            ₹
                          </div>
                        ) : item.method === "BANK_TRANSFER" ? (
                          <div className="w-6 h-6 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                            <Building className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-[10px]">
                            <CreditCard className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="font-semibold text-slate-900">
                          {item.rail}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-middle text-slate-600">
                      {item.destinationAccount}
                    </td>

                    <td className="py-3.5 px-4 align-middle">
                      <div className="space-y-0.5">
                        <div className="text-slate-900 font-semibold truncate max-w-[180px]">
                          {item.transactionHash}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(item.settlementReceiptHash)}
                          className="text-[10px] text-cobalt-600 hover:text-cobalt-800 flex items-center gap-1"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                              <span className="text-emerald-600">Hash Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy Receipt Hash</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-middle text-slate-500">
                      {item.timestamp.split("T")[0]}
                    </td>

                    <td className="py-3.5 px-4 align-middle text-right font-bold text-slate-900">
                      {formatMoney(item.amountUsd, item.amountInr)}
                    </td>

                    <td className="py-3.5 px-4 align-middle text-right">
                      {item.status === "SETTLED" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>SETTLED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>PROCESSING</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
