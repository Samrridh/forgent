"use client";

import React from "react";
import { AgentPortfolioData } from "@/lib/agent-portfolio";
import { useCurrency } from "@/context/currency-context";
import {
  ShieldCheck,
  Lock,
  Wallet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface EscrowBreakdownCardProps {
  agent: AgentPortfolioData;
}

export function EscrowBreakdownCard({
  agent,
}: EscrowBreakdownCardProps) {
  const { formatPrice, walletBalanceUsd, setIsTopUpOpen } = useCurrency();
  const hasSufficientFunds = walletBalanceUsd >= agent.priceUsd;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Live Escrow Settlement
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Verified Contract</span>
        </span>
      </div>

      {/* Primary Price */}
      <div>
        <div className="text-[11px] font-mono uppercase text-slate-500">
          Total Escrow Hold
        </div>
        <div className="font-mono text-3xl font-bold text-slate-900 mt-0.5">
          {formatPrice(agent.priceUsd)}
        </div>
        <div className="text-xs font-mono text-slate-500 mt-1">
          ₹{agent.priceInr.toLocaleString("en-IN")} ({agent.pricePaise.toLocaleString()} paise)
        </div>
      </div>

      {/* Breakdown Percentages */}
      <div className="bg-porcelain-100 rounded-xl p-4 space-y-2.5 text-xs font-mono">
        <div className="flex justify-between text-slate-700">
          <span>Task Price:</span>
          <span className="font-semibold text-slate-900">
            {formatPrice(agent.priceUsd)}
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Creator Payout (85%):</span>
          <span className="font-semibold text-slate-900">
            {formatPrice(agent.creatorPayoutUsd)} (₹{agent.creatorPayoutInr})
          </span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Platform Settlement Fee (15%):</span>
          <span className="font-semibold text-slate-900">
            {formatPrice(agent.platformFeeUsd)} (₹{agent.platformFeeInr})
          </span>
        </div>
        <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-600">
          <span>Watchdog Refund SLA:</span>
          <span className="font-semibold text-emerald-700">
            60 seconds
          </span>
        </div>
      </div>

      {/* Wallet Balance Check */}
      <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono space-y-1.5">
        <div className="flex justify-between text-slate-500">
          <span className="flex items-center gap-1">
            <Wallet className="w-3.5 h-3.5 text-slate-400" />
            <span>Buyer Wallet Balance:</span>
          </span>
          <span className="font-semibold text-slate-900">
            {formatPrice(walletBalanceUsd)}
          </span>
        </div>
        <div className="flex justify-between pt-1 border-t border-slate-100">
          <span>Available to Lock:</span>
          {hasSufficientFunds ? (
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Sufficient Balance</span>
            </span>
          ) : (
            <span className="text-amber-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Needs {formatPrice(agent.priceUsd - walletBalanceUsd)}</span>
            </span>
          )}
        </div>
      </div>

      {!hasSufficientFunds && (
        <button
          type="button"
          onClick={() => setIsTopUpOpen(true)}
          className="w-full py-2.5 px-3 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 text-xs font-mono font-semibold hover:bg-amber-100 transition-colors"
        >
          Top Up Wallet Balance
        </button>
      )}

      {/* Invariant Terms */}
      <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 text-slate-700 font-semibold font-mono">
          <Lock className="w-3.5 h-3.5 text-cobalt-500" />
          <span>Dual-Ledger Escrow Guarantee</span>
        </div>
        <p className="leading-relaxed">
          Funds are locked upon job creation and will only be released to creator wallet after cryptographic evidence receipt generation passes verification. If execution times out or fails, 100% of funds are refunded immediately.
        </p>
      </div>
    </div>
  );
}
