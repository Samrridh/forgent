"use client";

import React, { useState } from "react";
import { PayoutMethod, PayoutRecord } from "../creator-types";
import { useCurrency } from "@/context/currency-context";
import {
  X,
  CheckCircle2,
  ArrowRight,
  Receipt,
} from "lucide-react";

interface WithdrawModalProps {
  availableUsd: number;
  onClose: () => void;
  onSuccess: (payout: PayoutRecord) => void;
}

export function WithdrawModal({
  availableUsd,
  onClose,
  onSuccess,
}: WithdrawModalProps) {
  const { currency } = useCurrency();
  const [method, setMethod] = useState<PayoutMethod>(
    currency === "INR" ? "UPI" : "STRIPE"
  );
  const [amountUsd, setAmountUsd] = useState<number>(availableUsd);
  const [upiId, setUpiId] = useState("creator@okhdfcbank");
  const [bankAccount, setBankAccount] = useState("50100492817281");
  const [ifscCode, setIfscCode] = useState("HDFC0001829");
  const [stripeAccount, setStripeAccount] = useState("acct_1N9x4bL8K90vZmYq");
  const [isProcessing, setIsProcessing] = useState(false);
  const [settledReceipt, setSettledReceipt] = useState<PayoutRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const amountInr = Math.round(amountUsd * 80);
  const availableInr = Math.round(availableUsd * 80);

  const handleMaxAmount = () => {
    setAmountUsd(availableUsd);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (amountUsd <= 0) {
      setErrorMsg("Withdrawal amount must be greater than zero.");
      return;
    }
    if (amountUsd > availableUsd) {
      setErrorMsg("Amount exceeds your available payout balance.");
      return;
    }

    let destination = "";
    if (method === "UPI") {
      if (!upiId.includes("@")) {
        setErrorMsg("Please enter a valid UPI VPA address (e.g. name@bank).");
        return;
      }
      destination = upiId;
    } else if (method === "BANK_TRANSFER") {
      if (bankAccount.length < 8 || ifscCode.length < 4) {
        setErrorMsg("Please provide valid Bank Account & IFSC details.");
        return;
      }
      destination = `${ifscCode} - AC **${bankAccount.slice(-4)}`;
    } else {
      if (!stripeAccount.startsWith("acct_")) {
        setErrorMsg("Please enter a valid Stripe Connect account identifier (acct_...).");
        return;
      }
      destination = stripeAccount;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const txHash =
        "tx_0x" +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10) +
        Math.random().toString(16).slice(2, 10);

      const feeUsd = method === "STRIPE" ? Number((amountUsd * 0.0025).toFixed(2)) : 0;
      const feeInr = Math.round(feeUsd * 80);

      const payoutRecord: PayoutRecord = {
        id: `po-rec-${Date.now().toString(36)}`,
        transactionHash: txHash,
        method,
        destinationAccount: destination,
        amountUsd,
        amountInr,
        feeUsd,
        feeInr,
        status: "SETTLED",
        timestamp: new Date().toISOString(),
      };

      setSettledReceipt(payoutRecord);
      setIsProcessing(false);
      onSuccess(payoutRecord);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface-primary border border-border-default rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-default bg-porcelain-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cobalt-500 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {settledReceipt ? "Withdrawal Receipt Settled" : "Withdraw Available Funds"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {settledReceipt
                  ? "Simulated transaction settled with cryptographic proof."
                  : "Direct payout to UPI, Verified Bank Account, or Stripe."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {settledReceipt ? (
          /* Receipt View */
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/70 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h4 className="text-sm font-bold text-emerald-950">
                Funds Dispatched Successfully
              </h4>
              <p className="text-xs text-emerald-800">
                Simulated payout confirmed by clearing network.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-porcelain-50 font-mono text-xs space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Transaction Proof Hash</span>
                <span className="font-bold text-slate-800 select-all truncate max-w-[200px]">
                  {settledReceipt.transactionHash}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Payout Method</span>
                <span className="font-semibold text-slate-800">{settledReceipt.method}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Destination Account</span>
                <span className="font-semibold text-slate-800">{settledReceipt.destinationAccount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Gross Amount</span>
                <span className="font-bold text-slate-900">
                  ${settledReceipt.amountUsd.toFixed(2)} (₹{settledReceipt.amountInr.toLocaleString("en-IN")})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Network Processing Fee</span>
                <span className="text-slate-700">
                  {settledReceipt.feeUsd === 0 ? "₹0.00 (Zero Fee)" : `$${settledReceipt.feeUsd.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Settled Timestamp</span>
                <span className="text-slate-700">{new Date(settledReceipt.timestamp).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            {/* Available Balance Box */}
            <div className="p-3.5 rounded-lg border border-border-subtle bg-porcelain-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 block">
                  Available for Immediate Payout
                </span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
                  ${availableUsd.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-600">
                    (₹{availableInr.toLocaleString("en-IN")})
                  </span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleMaxAmount}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-cobalt-600"
              >
                Withdraw Max
              </button>
            </div>

            {/* Payout Method Tabs */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Destination Rails *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod("UPI")}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    method === "UPI"
                      ? "border-cobalt-500 bg-cobalt-50/70 text-cobalt-900 font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-mono">UPI</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Instant INR</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("BANK_TRANSFER")}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    method === "BANK_TRANSFER"
                      ? "border-cobalt-500 bg-cobalt-50/70 text-cobalt-900 font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-mono">Bank (NEFT)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">INR / SWIFT</div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("STRIPE")}
                  className={`p-3 rounded-lg border text-center transition-colors ${
                    method === "STRIPE"
                      ? "border-cobalt-500 bg-cobalt-50/70 text-cobalt-900 font-bold shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="text-xs font-mono">Stripe</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Direct USD</div>
                </button>
              </div>
            </div>

            {/* Dynamic Method Details */}
            {method === "UPI" && (
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  UPI Virtual Payment Address (VPA) *
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-cobalt-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Zero transfer fee. Immediate NPCI settlement.
                </span>
              </div>
            )}

            {method === "BANK_TRANSFER" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-cobalt-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    IFSC / SWIFT Code *
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-cobalt-500"
                  />
                </div>
              </div>
            )}

            {method === "STRIPE" && (
              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Connected Stripe Account ID *
                </label>
                <input
                  type="text"
                  value={stripeAccount}
                  onChange={(e) => setStripeAccount(e.target.value)}
                  placeholder="acct_1N9x4bL8K90vZmYq"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-cobalt-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Standard 0.25% ACH processing fee for USD payouts.
                </span>
              </div>
            )}

            {/* Withdrawal Amount Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider">
                  Amount to Withdraw *
                </label>
                <span className="text-[11px] font-mono text-slate-500">
                  Dual: ${amountUsd.toFixed(2)} / ₹{amountInr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  min={1}
                  max={availableUsd}
                  step={0.5}
                  value={amountUsd}
                  onChange={(e) => setAmountUsd(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-cobalt-500"
                />
              </div>
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing || availableUsd <= 0}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <span>{isProcessing ? "Processing Rail Settlement..." : "Execute Withdrawal"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
