"use client";

import React, { useState } from "react";
import {
  DepartmentBudget,
  AuditLedgerEntry,
} from "@/lib/contracts/enterprise-types";
import { useCurrency } from "@/context/currency-context";
import {
  Download,
  FileSpreadsheet,
  Search,
  Filter,
  Building2,
  Users,
  Coins,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface AuditLedgerTabProps {
  budgets: DepartmentBudget[];
  auditLogs: AuditLedgerEntry[];
}

export function AuditLedgerTab({ budgets, auditLogs }: AuditLedgerTabProps) {
  const { formatPrice } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const formatPaise = (paise: number) => {
    const usd = paise / 8000;
    return formatPrice(usd);
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesDept =
      selectedDepartment === "ALL" || log.department.includes(selectedDepartment);
    const matchesSearch =
      searchQuery.trim() === "" ||
      log.executor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.pipelineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.verificationHash.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const totalAllocatedPaise = budgets.reduce((acc, b) => acc + b.allocatedPaise, 0);
  const totalSpentPaise = budgets.reduce((acc, b) => acc + b.spentPaise, 0);
  const totalEscrowLockedPaise = budgets.reduce(
    (acc, b) => acc + b.escrowLockedPaise,
    0
  );

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Timestamp",
      "Executor",
      "Department",
      "Pipeline ID",
      "Pipeline Name",
      "Escrow Debited (Paise)",
      "Status",
      "Verification Hash",
      "Duration (ms)",
      "Summary",
    ];

    const rows = filteredLogs.map((log) => [
      log.id,
      log.timestamp,
      `"${log.executor}"`,
      `"${log.department}"`,
      log.pipelineId,
      `"${log.pipelineName}"`,
      log.escrowDebitedPaise,
      log.status,
      log.verificationHash,
      log.durationMs,
      `"${log.stageResultsSummary.replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `forgent-audit-report-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice("Exported CSV compliance audit report.");
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportJSON = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      organization: "Acme Global Logistics / Northstar Enterprise",
      complianceStandard: "SOX-404 / SOC2 Type II Certified",
      departmentBudgets: budgets,
      auditLedgerRecords: filteredLogs,
      verificationDigest: `SHA256-${Date.now().toString(16).toUpperCase()}`,
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `forgent-audit-compliance-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice("Exported cryptographic JSON compliance bundle.");
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Export & Action Notice */}
      {exportNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Enterprise Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 uppercase">
            <Coins className="w-3.5 h-3.5 text-cobalt-600" />
            <span>Total Org Allocation</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatPaise(totalAllocatedPaise)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            5 Active Departments
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 uppercase">
            <Coins className="w-3.5 h-3.5 text-slate-600" />
            <span>Cumulative Spend</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatPaise(totalSpentPaise)}
          </div>
          <div className="text-xs text-emerald-600 mt-0.5 font-mono">
            {((totalSpentPaise / totalAllocatedPaise) * 100).toFixed(1)}% Budget Utilized
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Active Escrow Locked</span>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {formatPaise(totalEscrowLockedPaise)}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Secured pending verification
          </div>
        </div>
      </div>

      {/* Departmental Wallet Allocation & Budget Utilization */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-cobalt-600" />
              <span>Departmental Wallet Allocation &amp; Budget Utilization</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Escrow commitment limits and live spend per organizational cost-center
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Real-time balance synchronization
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((dept) => {
            const utilizationPct = (dept.spentPaise / dept.allocatedPaise) * 100;
            return (
              <div
                key={dept.id}
                className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      {dept.department}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {dept.authorizedOwner}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cobalt-50 text-cobalt-700 font-semibold border border-cobalt-200">
                    {dept.activePipelines} Pipelines
                  </span>
                </div>

                {/* Spend Metric Details */}
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Allocated:</span>
                    <span className="font-semibold text-slate-900">
                      {formatPaise(dept.allocatedPaise)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Spent:</span>
                    <span className="text-slate-800">
                      {formatPaise(dept.spentPaise)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Escrow Locked:</span>
                    <span>{formatPaise(dept.escrowLockedPaise)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>Utilization</span>
                    <span>{utilizationPct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        utilizationPct > 80
                          ? "bg-amber-500"
                          : "bg-cobalt-500"
                      }`}
                      style={{ width: `${Math.min(100, utilizationPct)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Member Activity Log */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-cobalt-600" />
              <span>Team Member Activity Log &amp; Audit Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cryptographically verified execution trail with escrow settlement digests
            </p>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cobalt-600" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by team member, pipeline, or hash..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-cobalt-500 text-slate-800 font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-cobalt-500"
            >
              <option value="ALL">All Departments</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal</option>
              <option value="Engineering">Engineering</option>
              <option value="Supply">Procurement</option>
              <option value="People">Operations</option>
            </select>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Team Member</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Pipeline</th>
                <th className="px-4 py-2.5">Escrow Debited</th>
                <th className="px-4 py-2.5">Duration</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Verification Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-900 whitespace-nowrap">
                    {log.executor}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">
                    {log.department}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800 max-w-xs truncate">
                    {log.pipelineName}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-900 font-semibold whitespace-nowrap">
                    {formatPaise(log.escrowDebitedPaise)}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500 whitespace-nowrap">
                    {(log.durationMs / 1000).toFixed(2)}s
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <span
                      className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        log.status === "COMMITTED" || log.status === "SETTLED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                    {log.verificationHash.slice(0, 12)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
