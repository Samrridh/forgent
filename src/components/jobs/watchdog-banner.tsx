"use client";

import React, { useEffect, useState } from "react";
import { useCurrency } from "@/context/currency-context";
import {
  Clock,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface WatchdogBannerProps {
  isCompleted: boolean;
  isFailed: boolean;
  refundAmountUsd: number;
  onSimulateVerifiedSuccess?: () => void;
}

export function WatchdogBanner({
  isCompleted,
  isFailed,
  refundAmountUsd,
  onSimulateVerifiedSuccess,
}: WatchdogBannerProps) {
  const { formatPrice, topUpWallet } = useCurrency();
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isWatchdogTriggered, setIsWatchdogTriggered] = useState<boolean>(false);
  const [isRefundProcessed, setIsRefundProcessed] = useState<boolean>(false);

  // 60-second watchdog counter
  useEffect(() => {
    if (isCompleted || isFailed || isWatchdogTriggered) return;

    const interval = setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1;
        if (next >= 60) {
          setIsWatchdogTriggered(true);
          return 60;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCompleted, isFailed, isWatchdogTriggered]);

  // Process refund when watchdog triggers or job fails
  useEffect(() => {
    if ((isWatchdogTriggered || isFailed) && !isRefundProcessed && !isCompleted) {
      topUpWallet(refundAmountUsd);
      setIsRefundProcessed(true);
    }
  }, [isWatchdogTriggered, isFailed, isRefundProcessed, isCompleted, refundAmountUsd, topUpWallet]);

  const remaining = Math.max(0, 60 - secondsElapsed);
  const progressPercent = Math.min(100, (secondsElapsed / 60) * 100);

  // If already completed normally, show green confirmation
  if (isCompleted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-2.5 text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Execution completed within SLA ({secondsElapsed}s). Escrow released upon cryptographic evidence receipt.
          </span>
        </div>
        <span className="text-emerald-700 font-semibold shrink-0">
          Settlement Verified
        </span>
      </div>
    );
  }

  // If watchdog triggered or failed: Escrow refunded banner
  if (isWatchdogTriggered || isFailed) {
    return (
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-amber-900 font-serif text-base font-bold">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Escrow Refund Triggered: 60-Second Watchdog SLA</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Refund Processed ({formatPrice(refundAmountUsd)})</span>
          </span>
        </div>

        <p className="text-xs text-amber-800 leading-relaxed font-sans">
          The autonomous execution did not complete within the 60-second watchdog threshold or reported an unrecoverable runtime exception. Escrow protection automatically returned 100% of task funds ({formatPrice(refundAmountUsd)}) to your wallet balance.
        </p>

        {onSimulateVerifiedSuccess && (
          <div className="pt-2 border-t border-amber-200 flex items-center justify-between gap-4">
            <span className="text-[11px] font-mono text-amber-700">
              Testing without live LLM API keys?
            </span>
            <button
              type="button"
              onClick={onSimulateVerifiedSuccess}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white font-mono text-xs font-semibold shadow-sm transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Verified Deliverable</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active running state: Show 60-second watchdog countdown
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="flex items-center gap-2 text-slate-700 font-semibold">
          <Clock className="w-4 h-4 text-cobalt-500" />
          <span>60-Second Watchdog Escrow Timer</span>
        </span>
        <span className="text-slate-500">
          Elapsed: {secondsElapsed}s / 60s
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
        <div
          className="bg-cobalt-500 h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <Lock className="w-3 h-3 text-slate-400" />
          <span>Escrow Hold: {formatPrice(refundAmountUsd)} locked</span>
        </span>
        <span>Auto-refund in {remaining}s if execution stalls</span>
      </div>
    </div>
  );
}
