"use client";

import React from "react";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { ErpStateDiff, ReconciliationResult } from "@/lib/contracts/receiving-types";

interface ReceivingDiffViewerProps {
  diff: ErpStateDiff;
  reconciliation?: ReconciliationResult;
  onOpenCheckpointModal?: () => void;
}

export function ReceivingDiffViewer({
  diff,
  reconciliation,
  onOpenCheckpointModal,
}: ReceivingDiffViewerProps) {
  const isHeld = diff.commitStatus === "PENDING_HUMAN_CHECKPOINT";
  const isCommitted = diff.commitStatus === "AUTO_COMMITTED";
  const isOverridden = diff.commitStatus === "MANUALLY_OVERRIDDEN";

  const formatPaise = (paise: number) => {
    return (paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Header bar */}
      <div className="p-5 border-b border-slate-100 bg-porcelain-100/60 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              ERP Inventory State Delta
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                isCommitted
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : isHeld
                  ? "bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"
                  : "bg-cobalt-50 text-cobalt-800 border border-cobalt-200"
              }`}
            >
              {isCommitted && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
              {isHeld && <ShieldAlert className="w-3 h-3 text-amber-600" />}
              {isOverridden && <ShieldCheck className="w-3 h-3 text-cobalt-600" />}
              {diff.commitStatus.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Warehouse: {diff.warehouseId} • Generated: {new Date(diff.generatedAt).toLocaleTimeString()}
          </p>
        </div>

        {isHeld && onOpenCheckpointModal && (
          <button
            type="button"
            onClick={onOpenCheckpointModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Escalate Human Checkpoint</span>
          </button>
        )}
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200 font-mono">
        <div className="bg-white p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Total SKUs Affected
          </span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            {diff.items.length}
          </div>
          <span className="text-[10px] text-slate-500">
            {reconciliation?.perfectMatchCount || 0} Clean Matches
          </span>
        </div>

        <div className="bg-white p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Net On-Hand Delta
          </span>
          <div
            className={`text-lg font-bold mt-0.5 ${
              diff.netOnHandDelta > 0
                ? "text-emerald-700"
                : diff.netOnHandDelta === 0
                ? "text-slate-600"
                : "text-red-700"
            }`}
          >
            {diff.netOnHandDelta > 0 ? `+${diff.netOnHandDelta}` : diff.netOnHandDelta} units
          </div>
          <span className="text-[10px] text-slate-500">
            Physical accepted count
          </span>
        </div>

        <div className="bg-white p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Net Valuation Change
          </span>
          <div className="text-lg font-bold text-slate-900 mt-0.5">
            +₹{formatPaise(diff.netValuationDeltaPaise)}
          </div>
          <span className="text-[10px] text-slate-500">
            At purchase order base rate
          </span>
        </div>

        <div className="bg-white p-4">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Pending Vendor Credit
          </span>
          <div
            className={`text-lg font-bold mt-0.5 ${
              diff.totalPendingCreditPaise > 0 ? "text-amber-700" : "text-slate-600"
            }`}
          >
            ₹{formatPaise(diff.totalPendingCreditPaise)}
          </div>
          <span className="text-[10px] text-slate-500">
            {diff.totalPendingCreditPaise > 0 ? "Debit note recommended" : "Zero credit variance"}
          </span>
        </div>
      </div>

      {/* Diff Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-porcelain-50 border-b border-slate-100 font-mono text-[11px] text-slate-500">
              <th className="py-3 px-4 font-semibold">SKU & Item Details</th>
              <th className="py-3 px-4 font-semibold text-center">On-Hand Quantity</th>
              <th className="py-3 px-4 font-semibold text-right">Unit Rate</th>
              <th className="py-3 px-4 font-semibold text-right">Total Valuation</th>
              <th className="py-3 px-4 font-semibold text-right">Credit Memo</th>
              <th className="py-3 px-4 font-semibold text-center">Commit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {diff.items.map((item) => {
              const hasCredit = item.pendingInvoiceCreditPaise > 0;

              return (
                <tr key={item.sku} className="hover:bg-slate-50/70 transition-colors">
                  {/* SKU & Name */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900">{item.sku}</div>
                    <div className="text-[11px] text-slate-500 max-w-xs truncate">
                      {item.description}
                    </div>
                  </td>

                  {/* On-Hand Delta */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center gap-2 font-mono">
                      <span className="text-slate-400">{item.beforeOnHand}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                      <span className="font-bold text-slate-900">{item.afterOnHand}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          item.onHandDelta > 0
                            ? "bg-emerald-50 text-emerald-700"
                            : item.onHandDelta === 0
                            ? "bg-slate-100 text-slate-600"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {item.onHandDelta > 0 ? `+${item.onHandDelta}` : item.onHandDelta}
                      </span>
                    </div>
                  </td>

                  {/* Unit Rate */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-semibold text-slate-900">
                      ₹{formatPaise(item.afterUnitCostPaise)}
                    </div>
                    {item.unitCostDeltaPaise !== 0 && (
                      <span className="text-[10px] text-amber-600 font-medium">
                        Drift: ₹{formatPaise(item.unitCostDeltaPaise)}
                      </span>
                    )}
                  </td>

                  {/* Valuation */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-slate-900">
                      ₹{formatPaise(item.afterValuationPaise)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Was: ₹{formatPaise(item.beforeValuationPaise)}
                    </div>
                  </td>

                  {/* Credit Memo */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    {hasCredit ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        ₹{formatPaise(item.pendingInvoiceCreditPaise)}
                      </span>
                    ) : (
                      <span className="text-slate-400">₹0.00</span>
                    )}
                  </td>

                  {/* Commit Status */}
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                        item.status === "COMMITTED"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : item.status === "HELD_PENDING_APPROVAL"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {item.status === "COMMITTED" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {item.status === "HELD_PENDING_APPROVAL" && <AlertCircle className="w-3 h-3 text-amber-600" />}
                      {item.status === "REJECTED" && <AlertCircle className="w-3 h-3 text-red-600" />}
                      {item.status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
