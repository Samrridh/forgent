"use client";

import React, { useState } from "react";
import { PayoutRecord } from "../creator-types";
import { INITIAL_PAYOUT_HISTORY } from "../creator-data";
import { WithdrawModal } from "./withdraw-modal";
import { useCurrency } from "@/context/currency-context";
import {
  Wallet,
  Clock,
  TrendingUp,
  ArrowDownToLine,
  Receipt,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Building,
} from "lucide-react";

export function EarningsCenter() {
  const { currency } = useCurrency();
  const [availableUsd, setAvailableUsd] = useState(4250.00);
  const [pendingEscrowUsd] = useState(850.00);
  const [lifetimeEarningsUsd] = useState(18920.00);
  const [payouts, setPayouts] = useState<PayoutRecord[]>(INITIAL_PAYOUT_HISTORY);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const availableInr = Math.round(availableUsd * 80);
  const pendingInr = Math.round(pendingEscrowUsd * 80);
  const lifetimeInr = Math.round(lifetimeEarningsUsd * 80);

  const handleWithdrawSuccess = (record: PayoutRecord) => {
    setAvailableUsd((prev) => Math.max(0, prev - record.amountUsd));
    setPayouts((prev) => [record, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* 3 Top Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available for Payout */}
        <div className="p-6 rounded-xl border border-border-default bg-surface-primary space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>Available for Payout</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-emerald-700">
              {currency === "USD" ? `$${availableUsd.toFixed(2)}` : `₹${availableInr.toLocaleString("en-IN")}`}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              {currency === "USD" ? `(₹${availableInr.toLocaleString("en-IN")})` : `($${availableUsd.toFixed(2)})`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsWithdrawOpen(true)}
            disabled={availableUsd <= 0}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Withdraw Funds</span>
          </button>
        </div>

        {/* Pending Escrow */}
        <div className="p-6 rounded-xl border border-border-default bg-surface-primary space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>Pending Escrow</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-slate-800">
              {currency === "USD" ? `$${pendingEscrowUsd.toFixed(2)}` : `₹${pendingInr.toLocaleString("en-IN")}`}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              {currency === "USD" ? `(₹${pendingInr.toLocaleString("en-IN")})` : `($${pendingEscrowUsd.toFixed(2)})`}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-porcelain-100 border border-slate-200 text-[11px] text-slate-600">
            Funds automatically release into available balance following 24-hour verification window.
          </div>
        </div>

        {/* Lifetime Earnings */}
        <div className="p-6 rounded-xl border border-border-default bg-surface-primary space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 uppercase">
            <span>Lifetime Net Earnings (85%)</span>
            <TrendingUp className="w-4 h-4 text-cobalt-600" />
          </div>
          <div>
            <div className="text-3xl font-bold font-mono text-cobalt-600">
              {currency === "USD" ? `$${lifetimeEarningsUsd.toFixed(2)}` : `₹${lifetimeInr.toLocaleString("en-IN")}`}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono">
              {currency === "USD" ? `(₹${lifetimeInr.toLocaleString("en-IN")})` : `($${lifetimeEarningsUsd.toFixed(2)})`}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-porcelain-100 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cobalt-600 shrink-0" />
            <span>Cumulative creator settlement revenue across all active agents.</span>
          </div>
        </div>
      </div>

      {/* Payout Channels & Rules Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-border-default bg-surface-primary text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded bg-cobalt-50 text-cobalt-600 flex items-center justify-center shrink-0">
            <Building className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">UPI Instant Rail</span>
            <span className="text-slate-500 text-[11px]">Direct transfer to Indian VPAs. 0% network processing fee.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded bg-cobalt-50 text-cobalt-600 flex items-center justify-center shrink-0">
            <Building className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">Bank Wire / NEFT</span>
            <span className="text-slate-500 text-[11px]">Direct account transfer with IFSC / SWIFT routing numbers.</span>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-6 h-6 rounded bg-cobalt-50 text-cobalt-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-900 block">Stripe Connect USD</span>
            <span className="text-slate-500 text-[11px]">Direct ACH checking deposit with automated tax summaries.</span>
          </div>
        </div>
      </div>

      {/* Settlement History Table */}
      <div className="border border-border-default rounded-xl bg-surface-primary overflow-hidden shadow-xs space-y-0">
        <div className="p-4 border-b border-border-subtle bg-porcelain-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-cobalt-600" />
            <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
              Settlement &amp; Withdrawal Ledger
            </h4>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {payouts.length} Recorded Transactions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-white text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Transaction Proof Hash</th>
                <th className="py-3 px-4 font-semibold">Method</th>
                <th className="py-3 px-4 font-semibold">Destination Account</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Fee</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-mono">
              {payouts.map((record) => {
                const amountStr =
                  currency === "USD"
                    ? `$${record.amountUsd.toFixed(2)}`
                    : `₹${record.amountInr.toLocaleString("en-IN")}`;
                const feeStr =
                  record.feeUsd === 0
                    ? "₹0"
                    : currency === "USD"
                    ? `$${record.feeUsd.toFixed(2)}`
                    : `₹${record.feeInr.toLocaleString("en-IN")}`;

                return (
                  <tr key={record.id} className="hover:bg-porcelain-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <span className="select-all truncate max-w-[150px] block" title={record.transactionHash}>
                        {record.transactionHash.slice(0, 16)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">
                        {record.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {record.destinationAccount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {amountStr}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {feeStr}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{record.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 text-[11px]">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isWithdrawOpen && (
        <WithdrawModal
          availableUsd={availableUsd}
          onClose={() => setIsWithdrawOpen(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}
    </div>
  );
}
