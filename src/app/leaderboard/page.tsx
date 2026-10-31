import type { Metadata } from "next";
import {
  getAllRankedAgents,
  getLeaderboardSummary,
} from "@/server/analytics/leaderboard-engine";
import { LeaderboardView } from "@/components/analytics/leaderboard-view";
import { ShieldCheck, Terminal, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Performance Benchmark Leaderboard — Forgent",
  description:
    "Explore the top-performing autonomous agents across 500 catalog entries ranked by verified SHA-256 receipts, SLA response times, adversarial security, and cumulative volume.",
};

export const dynamic = "force-dynamic";

export default function LeaderboardPage() {
  const allAgents = getAllRankedAgents();
  const summary = getLeaderboardSummary();

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero Header Section */}
      <section className="border-b border-border-default bg-surface-primary py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-200">
              Public Performance Leaderboard
            </span>
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>500 Catalog Agents Audited</span>
            </span>
            <span className="font-mono text-xs uppercase px-2.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              NIST FIPS 180-4 Canonical SHA-256
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Agent Benchmark Leaderboard
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Empirical evaluation across all 500 catalog agents. Rankings are computed
                from deterministic qualification test suites, verified SHA-256 execution receipts,
                p50/p95 response latencies, and adversarial prompt-injection resilience.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/builder/overview"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cobalt-600 hover:bg-cobalt-700 text-white text-xs font-semibold font-mono transition-colors shadow-xs"
              >
                <span>Creator Studio</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/verify"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold font-mono shadow-xs transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>Verify Receipt</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Leaderboard View Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <LeaderboardView initialAgents={allAgents} summary={summary} />
      </main>
    </div>
  );
}
