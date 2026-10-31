"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scale,
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { DisputeReasonCategory, DisputeRecord } from "@/server/arbitration/oracle-arbiter";

interface FileDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  agentSlug: string;
  deliverableSha256?: string;
  onDisputeCreated?: (dispute: DisputeRecord) => void;
}

export function FileDisputeModal({
  isOpen,
  onClose,
  jobId,
  agentSlug,
  deliverableSha256,
  onDisputeCreated,
}: FileDisputeModalProps) {
  const [category, setCategory] = useState<DisputeReasonCategory>("INVENTORY_DISCREPANCY");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdDispute, setCreatedDispute] = useState<DisputeRecord | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please provide a title and detailed description for this dispute.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          category,
          title: title.trim(),
          description: description.trim(),
          claimedDeliverableHash: deliverableSha256,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit dispute");
      }

      setCreatedDispute(data.dispute);
      if (onDisputeCreated) {
        onDisputeCreated(data.dispute);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit dispute");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-porcelain-100 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-slate-900">
                File Contract Dispute
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Work Order: {jobId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdDispute ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-emerald-900">
                    Dispute Successfully Filed
                  </h3>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Dispute record <span className="font-mono font-bold">{createdDispute.id}</span> has been created.
                    The neutral multi-agent Oracle Arbiter is ready to evaluate contract criteria against deliverables.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs font-mono space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dispute ID:</span>
                  <span className="font-bold text-slate-800">{createdDispute.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category:</span>
                  <span className="text-slate-800">{createdDispute.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-amber-700 font-bold">{createdDispute.status}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-mono rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  Close
                </button>
                <Link
                  href="/disputes"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white transition-colors"
                >
                  <span>Go to Disputes Center</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="text-xs text-slate-600 leading-relaxed">
                Submitting a dispute pauses automated escrow release. The impartial Oracle Arbiter analyzes
                original job specifications against produced deliverable output and cryptographic evidence.
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1.5">
                  Dispute Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DisputeReasonCategory)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-cobalt-500"
                >
                  <option value="INVENTORY_DISCREPANCY">
                    Inventory Reconciliation Discrepancy
                  </option>
                  <option value="SCHEMA_FAILURE">
                    Schema Validation Failure
                  </option>
                  <option value="UNFULFILLED_CRITERIA">
                    Unfulfilled Contract Criteria
                  </option>
                  <option value="CORRUPTED_DELIVERABLE">
                    Corrupted Deliverable Payload
                  </option>
                  <option value="LATENCY_SLA_BREACH">
                    Watchdog SLA Latency Breach
                  </option>
                  <option value="OTHER">Other Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1.5">
                  Dispute Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Line item 14 quantity variance in receiving scan"
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cobalt-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-700 mb-1.5">
                  Detailed Evidence & Justification
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="State the exact contractual criteria, expected metrics, or schema requirements that failed to reconcile..."
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cobalt-500"
                  required
                />
              </div>

              <div className="p-3 rounded-lg bg-porcelain-100 border border-slate-200 text-[11px] font-mono text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-cobalt-600" />
                  <span>Autonomous Escrow Protocol</span>
                </div>
                <p>
                  Agent: <span className="text-slate-800">{agentSlug}</span> • Cryptographic Hash:{" "}
                  <span className="text-slate-800 truncate block max-w-full">
                    {deliverableSha256 || "Pending verification digest"}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-mono rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-semibold rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Filing Dispute...</span>
                    </>
                  ) : (
                    <>
                      <Scale className="w-3.5 h-3.5" />
                      <span>Submit Dispute</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
