"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  X,
  AlertTriangle,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import {
  HumanCheckpoint,
  CheckpointResolution,
  CheckpointResolutionAction,
} from "@/lib/contracts/receiving-types";

interface ReceivingCheckpointModalProps {
  isOpen: boolean;
  checkpoint: HumanCheckpoint;
  onResolve: (resolution: CheckpointResolution) => void;
  onClose: () => void;
}

export function ReceivingCheckpointModal({
  isOpen,
  checkpoint,
  onResolve,
  onClose,
}: ReceivingCheckpointModalProps) {
  const [selectedAction, setSelectedAction] =
    useState<CheckpointResolutionAction>("APPROVE_WITH_CREDIT_MEMO");
  const [reviewerName, setReviewerName] = useState("Sarah Chen (Director of Supply Chain)");
  const [notes, setNotes] = useState(
    "Approved physical intake of verified conforming units. Vendor credit memo authorized for short delivery, damage, and unauthorized unit price variance."
  );

  if (!isOpen) return null;

  const handleConfirm = () => {
    onResolve({
      action: selectedAction,
      reviewerName: reviewerName.trim() || "Enterprise Administrator",
      notes: notes.trim() || "Policy exception reviewed and resolved via interactive checkpoint.",
      resolvedAt: new Date().toISOString(),
      authorizedCreditMemoPaise: checkpoint.financialExposurePaise,
    });
  };

  const exposureFormatted = (checkpoint.financialExposurePaise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkpoint-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-porcelain-100/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-200 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="checkpoint-modal-title" className="text-sm font-bold text-slate-900">
                  Human-in-the-Loop Exception Checkpoint
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold uppercase tracking-wider">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                ID: {checkpoint.checkpointId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Reason Alert Banner */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-950 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900">
                  Automated Commit Suspended by Policy Trigger
                </p>
                <p className="text-slate-600 mt-0.5 leading-relaxed">
                  {checkpoint.reason}
                </p>
              </div>
            </div>

            {/* Triggers Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 font-mono text-[11px]">
              {checkpoint.triggers.map((trigger, idx) => (
                <div
                  key={idx}
                  className="bg-white/80 p-2.5 rounded-lg border border-amber-200/70 flex flex-col justify-between"
                >
                  <span className="text-slate-500 uppercase tracking-wider text-[9px] font-bold">
                    {trigger.type.replace(/_/g, " ")}
                  </span>
                  <div className="mt-1 flex items-baseline justify-between text-slate-900 font-semibold">
                    <span>Observed: {trigger.observed}</span>
                    <span className="text-slate-500 text-[10px]">Max: {trigger.threshold}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Exposure Metric */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-porcelain-50">
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign className="w-4 h-4 text-cobalt-600" />
              <span className="font-medium">Total Unreconciled Financial Exposure</span>
            </div>
            <span className="font-mono font-bold text-sm text-slate-900">
              ₹{exposureFormatted}
            </span>
          </div>

          {/* Decision Resolution Options */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2">
              Select Resolution Directive
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedAction === "APPROVE_WITH_CREDIT_MEMO"
                    ? "border-cobalt-500 bg-cobalt-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="resolutionAction"
                  value="APPROVE_WITH_CREDIT_MEMO"
                  checked={selectedAction === "APPROVE_WITH_CREDIT_MEMO"}
                  onChange={() => setSelectedAction("APPROVE_WITH_CREDIT_MEMO")}
                  className="mt-0.5 text-cobalt-600 focus:ring-cobalt-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      Commit Conforming Inventory & Issue Credit Memo
                    </span>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Standard Procedure
                    </span>
                  </div>
                  <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">
                    Adds physically accepted, non-damaged units to live inventory at purchase order rate.
                    Generates an audited debit claim of ₹{exposureFormatted} against supplier invoice.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedAction === "REJECT_SHIPMENT"
                    ? "border-red-500 bg-red-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="resolutionAction"
                  value="REJECT_SHIPMENT"
                  checked={selectedAction === "REJECT_SHIPMENT"}
                  onChange={() => setSelectedAction("REJECT_SHIPMENT")}
                  className="mt-0.5 text-red-600 focus:ring-red-500"
                />
                <div>
                  <span className="font-semibold text-slate-900">
                    Reject Entire Inbound Shipment
                  </span>
                  <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">
                    Zero inventory is committed to the ERP ledger. Goods quarantined at dock for return to vendor.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedAction === "ACCEPT_PRICE_DRIFT"
                    ? "border-amber-500 bg-amber-50/50 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="resolutionAction"
                  value="ACCEPT_PRICE_DRIFT"
                  checked={selectedAction === "ACCEPT_PRICE_DRIFT"}
                  onChange={() => setSelectedAction("ACCEPT_PRICE_DRIFT")}
                  className="mt-0.5 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <span className="font-semibold text-slate-900">
                    Authorize Price Drift Override
                  </span>
                  <p className="text-slate-500 mt-0.5 text-[11px] leading-relaxed">
                    Accepts the higher invoiced unit cost into ERP weighted-average valuation without debit recovery.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Reviewer Signature & Audit Notes */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Authorized Reviewer Name & Title
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-cobalt-500 focus:border-cobalt-500"
                placeholder="e.g. John Doe (Quality Manager)"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Audit Trail Resolution Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 focus:ring-1 focus:ring-cobalt-500 focus:border-cobalt-500"
                placeholder="Document justification for ERP override..."
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-porcelain-100/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <span>Authorize Directive & Seal Receipt</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
