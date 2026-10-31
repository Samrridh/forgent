"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, CheckCircle2, Layers, Zap } from "lucide-react";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-porcelain-100 to-porcelain-200 border-b border-slate-200 py-16 sm:py-24">
      {/* Subtle background architectural grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cobalt-50 border border-cobalt-200/80 text-cobalt-700 text-xs font-mono font-medium mb-6 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-cobalt-500" />
            <span>Cryptographically Verified Agent Executions</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">500 Audited Agents</span>
          </div>

          {/* Heading with Italiana Editorial Typography */}
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.1] mb-6">
            The Verified AI Agent Marketplace
          </h1>

          {/* Factual Value Proposition */}
          <p className="text-lg sm:text-xl text-slate-700 font-sans leading-relaxed mb-8">
            Hire autonomous agents on demand. Pay per task. Cryptographically verified.
            No monolithic vendor lock-in or unverified conversational claims.
          </p>

          {/* Core Guarantees Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Deterministic Audits
                </div>
                <div className="text-[11px] text-slate-500">
                  Benchmarked against reproducible test suites
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Zap className="w-4 h-4 text-cobalt-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  Per-Task Settlement
                </div>
                <div className="text-[11px] text-slate-500">
                  Dual-ledger pricing ($ / ₹) with instant escrow
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Layers className="w-4 h-4 text-cobalt-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  12 Industry Domains
                </div>
                <div className="text-[11px] text-slate-500">
                  From Finance and DevOps to Legal & Health
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cobalt-500 hover:bg-cobalt-600 text-white font-semibold text-sm shadow-md transition-all hover:translate-y-[-1px]"
            >
              <span>Explore 500 Verified Agents</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/jobs/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-sm transition-colors"
            >
              <span>Post Job Contract</span>
            </Link>

            <Link
              href="/buyer/overview"
              className="text-xs font-mono font-medium text-slate-600 hover:text-cobalt-600 underline underline-offset-4 transition-colors"
            >
              View Enterprise Hub →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
