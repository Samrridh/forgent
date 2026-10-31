"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCurrency } from "@/context/currency-context";
import {
  Scale,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { DisputeRecord, DisputeStatus } from "@/server/arbitration/oracle-arbiter";
import { DisputeDetailDrawer } from "./dispute-detail-drawer";

export function DisputesView() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");
  const { currency } = useCurrency();

  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | DisputeStatus>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDispute, setSelectedDispute] = useState<DisputeRecord | null>(null);

  const fetchDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/disputes");
      if (res.ok) {
        const data = await res.json();
        setDisputes(data.disputes || []);

        if (initialId && !selectedDispute) {
          const match = (data.disputes as DisputeRecord[]).find((d) => d.id === initialId || d.jobId === initialId);
          if (match) setSelectedDispute(match);
        }
      }
    } catch {
      // Graceful offline fallback
    } finally {
      setLoading(false);
    }
  }, [initialId, selectedDispute]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const totalCount = disputes.length;
  const pendingCount = disputes.filter((d) => d.status === "PENDING_ARBITRATION").length;
  const resolvedCount = disputes.filter((d) => d.status === "RESOLVED").length;

  const filteredDisputes = disputes.filter((d) => {
    if (statusFilter !== "ALL" && d.status !== statusFilter) return false;
    if (categoryFilter !== "ALL" && d.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = d.id.toLowerCase().includes(q);
      const matchJob = d.jobId.toLowerCase().includes(q);
      const matchAgent = d.agentSlug.toLowerCase().includes(q);
      const matchTitle = d.title.toLowerCase().includes(q);
      if (!matchId && !matchJob && !matchAgent && !matchTitle) return false;
    }
    return true;
  });

  const formatAmount = (cents: number, paise: number) => {
    if (currency === "INR") {
      return `₹${(paise / 100).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${(cents / 100).toFixed(2)}`;
  };

  const handleDisputeUpdated = (updated: DisputeRecord) => {
    setDisputes((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setSelectedDispute(updated);
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>Total Disputes</span>
            <Scale className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-slate-900 mt-2">
            {totalCount}
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-1 block">
            Across active agent contracts
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>Pending Arbitration</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-amber-700 mt-2">
            {pendingCount}
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-1 block">
            Escrow locked awaiting verdict
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>Settled & Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-emerald-700 mt-2">
            {resolvedCount}
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-1 block">
            Automated balance settlements
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-mono">
            <span>Cryptographic Audits</span>
            <ShieldCheck className="w-4 h-4 text-cobalt-600" />
          </div>
          <div className="font-serif text-2xl font-bold text-slate-900 mt-2">
            100%
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-1 block">
            SHA-256 resolution receipts
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-porcelain-100 rounded-lg border border-slate-200 self-start">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                statusFilter === "ALL"
                  ? "bg-white text-cobalt-600 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Disputes ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING_ARBITRATION")}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                statusFilter === "PENDING_ARBITRATION"
                  ? "bg-white text-amber-700 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("RESOLVED")}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded-md transition-colors ${
                statusFilter === "RESOLVED"
                  ? "bg-white text-emerald-700 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDisputes}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Refresh disputes"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <Link
              href="/verify"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Public Inspector</span>
            </Link>
          </div>
        </div>

        {/* Search & Category Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by dispute ID, work order ID, agent, or title..."
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cobalt-500"
            />
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-cobalt-500"
            >
              <option value="ALL">All Categories</option>
              <option value="INVENTORY_DISCREPANCY">Inventory Discrepancy</option>
              <option value="SCHEMA_FAILURE">Schema Failure</option>
              <option value="UNFULFILLED_CRITERIA">Unfulfilled Criteria</option>
              <option value="CORRUPTED_DELIVERABLE">Corrupted Deliverable</option>
              <option value="LATENCY_SLA_BREACH">Latency SLA Breach</option>
              <option value="OTHER">Other Discrepancy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Disputes List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cobalt-500" />
            <p>Loading dispute registry...</p>
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500 space-y-3">
            <Scale className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-slate-700 font-semibold text-sm">No disputes found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              There are no active or historical disputes matching the current filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-porcelain-100 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Dispute & Contract</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Escrow Claim</th>
                  <th className="px-4 py-3">Status / Verdict</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredDisputes.map((dispute) => {
                  const isDispResolved = dispute.status === "RESOLVED";
                  const res = dispute.resolution;

                  return (
                    <tr
                      key={dispute.id}
                      onClick={() => setSelectedDispute(dispute)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900 truncate max-w-xs">
                          {dispute.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ID: <span className="font-bold text-slate-600">{dispute.id}</span> • WO:{" "}
                          <span>{dispute.jobId}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                          {dispute.agentSlug}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[11px] text-slate-600">
                          {dispute.category.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {formatAmount(dispute.claimAmountCents, dispute.claimAmountPaise)}
                      </td>
                      <td className="px-4 py-3.5">
                        {isDispResolved && res ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                res.verdict === "REFUND_BUYER"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : res.verdict === "RELEASE_CREATOR"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {res.verdict.replace(/_/g, " ")}
                            </span>
                            <div className="text-[10px] text-slate-400">
                              {res.refundPercentage}% refunded
                            </div>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                            PENDING ARBITRATION
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDispute(dispute);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
                        >
                          <span>{isDispResolved ? "View Receipt" : "Inspect & Arbitrate"}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Dispute Detail Drawer */}
      {selectedDispute && (
        <DisputeDetailDrawer
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onDisputeUpdated={handleDisputeUpdated}
        />
      )}
    </div>
  );
}
