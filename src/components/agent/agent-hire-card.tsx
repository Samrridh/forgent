"use client";

import React from "react";
import Link from "next/link";
import { AgentPortfolioData } from "@/lib/agent-portfolio";
import { useCurrency } from "@/context/currency-context";
import {
  ArrowRight,
  CheckCircle2,
  Lock,
  Wallet,
  AlertCircle,
} from "lucide-react";

interface AgentHireCardProps {
  agent: AgentPortfolioData;
}

export function AgentHireCard({ agent }: AgentHireCardProps) {
  const { formatPrice, walletBalanceUsd, setIsTopUpOpen } = useCurrency();
  const hasSufficientFunds = walletBalanceUsd >= agent.priceUsd;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-24">
      {/* Header & Price */}
      <div className="space-y-3 pb-4 border-b border-slate-100">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Autonomous Task Contract
        </span>
        <div>
          <div className="font-mono text-3xl font-bold text-slate-900">
            {formatPrice(agent.priceUsd)}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1">
            ₹{agent.priceInr.toLocaleString("en-IN")} ({agent.pricePaise.toLocaleString()} paise) per execution
          </div>
        </div>
      </div>

      {/* Escrow Fee Breakdown */}
      <div className="bg-porcelain-100 rounded-xl p-4 space-y-2.5 text-xs font-mono">
        <div className="flex justify-between text-slate-600">
          <span>Creator Payout (85%):</span>
          <span className="font-semibold text-slate-900">
            {formatPrice(agent.creatorPayoutUsd)}
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Platform Escrow Fee (15%):</span>
          <span className="font-semibold text-slate-900">
            {formatPrice(agent.platformFeeUsd)}
          </span>
        </div>
        <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
          <span>Latency SLA:</span>
          <span className="font-semibold text-slate-900">
            {agent.avgLatencyMs}ms (P95: {agent.p95LatencyMs}ms)
          </span>
        </div>
      </div>

      {/* Buyer Wallet Status */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono space-y-1.5">
        <div className="flex justify-between text-slate-500">
          <span className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
            <span>Wallet Balance:</span>
          </span>
          <span className="font-semibold text-slate-900">
            {formatPrice(walletBalanceUsd)}
          </span>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-100">
          <span>Escrow Status:</span>
          {hasSufficientFunds ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Funds Ready</span>
            </span>
          ) : (
            <span className="text-amber-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Needs Top Up</span>
            </span>
          )}
        </div>
      </div>

      {/* Primary Hire CTA Button */}
      <div className="space-y-2">
        <Link
          href={`/jobs/new?agent=${agent.slug}`}
          className="w-full py-3.5 px-4 rounded-xl bg-cobalt-500 hover:bg-cobalt-600 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 group"
        >
          <span>Hire Agent Contract</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
        {!hasSufficientFunds && (
          <button
            type="button"
            onClick={() => setIsTopUpOpen(true)}
            className="w-full py-2 px-3 text-xs font-mono text-cobalt-600 hover:text-cobalt-800 transition-colors text-center"
          >
            Top up wallet balance
          </button>
        )}
      </div>

      {/* Escrow Guarantee Statement */}
      <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold font-mono">
          <Lock className="w-3.5 h-3.5 text-cobalt-500" />
          <span>Smart Escrow Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Task budget is locked in escrow during execution. If the runtime exceeds the 60-second watchdog timer or verification fails, 100% of escrow funds are refunded automatically.
        </p>
      </div>
    </div>
  );
}
