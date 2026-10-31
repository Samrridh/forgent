"use client";

import React from "react";
import Link from "next/link";
import { Agent } from "@/types/agent";
import { useCurrency } from "@/context/currency-context";
import {
  ShieldCheck,
  Star,
  Clock,
  ArrowRight,
  User,
  Zap,
} from "lucide-react";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const { formatPrice } = useCurrency();

  return (
    <div className="group relative bg-white border border-slate-200 hover:border-cobalt-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-porcelain-200 text-slate-700 border border-slate-200/80">
            {agent.category}
          </span>

          {agent.verified && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
              title={`Benchmark verified with ${agent.benchmarkScore}% accuracy score`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{agent.benchmarkScore}% Verified</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-sans text-base font-bold text-slate-900 group-hover:text-cobalt-600 transition-colors line-clamp-1 mb-1">
          <Link href={`/agents/${agent.slug}`} className="hover:underline">
            {agent.title}
          </Link>
        </h3>

        {/* Creator Handle & Version */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5 font-mono">
          <span className="inline-flex items-center gap-1 text-slate-600">
            <User className="w-3 h-3 text-slate-400" />
            <span>{agent.creatorHandle}</span>
          </span>
          <span>•</span>
          <span className="text-slate-400">{agent.version}</span>
        </div>

        {/* Factual Engineering Bio */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
          {agent.bio}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/60"
            >
              #{tag}
            </span>
          ))}
          {agent.runtimeType === "deterministic" && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-100 flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />
              <span>Deterministic</span>
            </span>
          )}
        </div>
      </div>

      {/* Bottom Performance & Action Footer */}
      <div className="pt-3.5 border-t border-slate-100 mt-auto">
        {/* Performance Metrics Row */}
        <div className="grid grid-cols-3 gap-2 py-2 mb-3 bg-porcelain-100 rounded-lg px-2 text-[11px] font-mono text-slate-600">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-tight">Rating</div>
            <div className="flex items-center gap-1 font-semibold text-slate-900 mt-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{agent.rating}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-tight">Completed</div>
            <div className="font-semibold text-slate-900 mt-0.5 truncate">
              {agent.tasksCompleted.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-tight">Latency</div>
            <div className="flex items-center gap-0.5 font-semibold text-slate-900 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{agent.latencyMs}ms</span>
            </div>
          </div>
        </div>

        {/* Price & CTA Button */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
              Price per task
            </div>
            <div className="font-mono text-base font-bold text-slate-900">
              {formatPrice(agent.pricePerTaskUsd)}
            </div>
          </div>

          <Link
            href={`/jobs/new?agent=${agent.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-all group-hover:translate-x-0.5"
          >
            <span>Hire Agent</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
