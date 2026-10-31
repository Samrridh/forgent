"use client";

import React from "react";
import Link from "next/link";
import { AgentPortfolioData } from "@/lib/agent-portfolio";
import { useCurrency } from "@/context/currency-context";
import {
  ShieldCheck,
  Star,
  Clock,
  CheckCircle2,
  User,
  ArrowRight,
  Layers,
  ChevronRight,
} from "lucide-react";

interface AgentHeroProps {
  agent: AgentPortfolioData;
}

export function AgentHero({ agent }: AgentHeroProps) {
  const { formatPrice } = useCurrency();

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-6">
          <Link href="/marketplace" className="hover:text-slate-900 transition-colors">
            Marketplace
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link
            href={`/marketplace?category=${encodeURIComponent(agent.category)}`}
            className="hover:text-slate-900 transition-colors"
          >
            {agent.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-medium truncate max-w-xs">{agent.title}</span>
        </nav>

        {/* Hero Header Body */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-porcelain-200 text-slate-800 border border-slate-200">
                {agent.category}
              </span>
              {agent.verified && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Verified Agent ({agent.benchmarkScore}% accuracy)</span>
                </span>
              )}
              <span className="text-xs font-mono text-slate-500">
                Version {agent.version}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              {agent.title}
            </h1>

            <div className="flex items-center gap-3 text-xs font-mono text-slate-600">
              <span className="inline-flex items-center gap-1.5 text-slate-800">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold">{agent.authorName}</span>
              </span>
              <span>•</span>
              <span className="text-slate-500">{agent.builderStudio}</span>
              <span>•</span>
              <span className="text-cobalt-600 uppercase font-semibold">
                {agent.runtimeType} runtime
              </span>
            </div>

            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {agent.description}
            </p>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] font-mono uppercase text-slate-500">Rating</div>
                <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-slate-900 mt-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{agent.rating}</span>
                  <span className="text-xs font-normal text-slate-500">({agent.ratingCount})</span>
                </div>
              </div>

              <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] font-mono uppercase text-slate-500">Avg Latency</div>
                <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-slate-900 mt-0.5">
                  <Clock className="w-4 h-4 text-cobalt-500" />
                  <span>{agent.avgLatencyMs}ms</span>
                </div>
              </div>

              <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] font-mono uppercase text-slate-500">Accuracy Benchmark</div>
                <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-emerald-700 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{agent.benchmarkScore}%</span>
                </div>
              </div>

              <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-3">
                <div className="text-[11px] font-mono uppercase text-slate-500">Execution Proof</div>
                <div className="flex items-center gap-1.5 font-mono text-lg font-bold text-slate-900 mt-0.5">
                  <Layers className="w-4 h-4 text-cobalt-500" />
                  <span>SHA-256</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Hire CTA Box for Large Screens */}
          <div className="w-full lg:w-72 bg-porcelain-100 border border-slate-200 rounded-2xl p-5 shrink-0 flex flex-col justify-between">
            <div className="space-y-3 mb-4">
              <div className="text-xs font-mono uppercase text-slate-500 tracking-wider">
                Execution Price
              </div>
              <div>
                <div className="font-mono text-3xl font-bold text-slate-900">
                  {formatPrice(agent.priceUsd)}
                </div>
                <div className="text-xs font-mono text-slate-500 mt-0.5">
                  ₹{agent.priceInr.toLocaleString("en-IN")} ({agent.pricePaise.toLocaleString()} paise) / task
                </div>
              </div>
              <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span>Escrow Protection:</span>
                  <span className="font-semibold text-slate-900">100% Guaranteed</span>
                </div>
                <div className="flex justify-between">
                  <span>Refund Watchdog:</span>
                  <span className="font-semibold text-slate-900">60-second limit</span>
                </div>
              </div>
            </div>

            <Link
              href={`/jobs/new?agent=${agent.slug}`}
              className="w-full py-3 px-4 rounded-xl bg-cobalt-500 hover:bg-cobalt-600 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Hire Agent</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
