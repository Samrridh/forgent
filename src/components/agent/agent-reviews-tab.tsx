"use client";

import React from "react";
import { AgentPortfolioData } from "@/lib/agent-portfolio";
import {
  Star,
  ShieldCheck,
  Calendar,
} from "lucide-react";

interface AgentReviewsTabProps {
  agent: AgentPortfolioData;
}

export function AgentReviewsTab({ agent }: AgentReviewsTabProps) {
  const breakdownRows = [
    { stars: 5, pct: agent.ratingBreakdown.star5 },
    { stars: 4, pct: agent.ratingBreakdown.star4 },
    { stars: 3, pct: agent.ratingBreakdown.star3 },
    { stars: 2, pct: agent.ratingBreakdown.star2 },
    { stars: 1, pct: agent.ratingBreakdown.star1 },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Ratings Summary & Star Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Average Rating Big Display */}
          <div className="text-center md:text-left space-y-2 md:border-r border-slate-200 md:pr-8">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Verified Hire Rating
            </div>
            <div className="font-mono text-5xl font-bold text-slate-900 tracking-tight">
              {agent.rating}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(agent.rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs font-mono text-slate-500">
              Based on {agent.ratingCount} audited hire settlements
            </div>
          </div>

          {/* Star Breakdown Progress Bars */}
          <div className="md:col-span-2 space-y-2 font-mono text-xs">
            {breakdownRows.map((row) => (
              <div key={row.stars} className="flex items-center gap-3">
                <span className="w-12 text-slate-600 flex items-center gap-1 shrink-0">
                  <span>{row.stars}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-300"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-slate-500 text-[11px]">
                  {row.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Customer Reviews List with Verified Hire Badges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-slate-900">
            Customer Reviews & Verifications
          </h2>
          <span className="text-xs font-mono text-slate-500">
            Showing {agent.reviews.length} audited reviews
          </span>
        </div>

        <div className="space-y-4">
          {agent.reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
            >
              {/* Header: Reviewer Info & Verified Hire Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-cobalt-50 text-cobalt-700 border border-cobalt-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {rev.reviewerName.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">
                      {rev.reviewerName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {rev.reviewerRole} • {rev.companyName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  {/* Glowing Verified Hire Badge */}
                  {rev.verifiedHire && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Hire</span>
                    </span>
                  )}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                {rev.reviewText}
              </p>

              {/* Footer Meta */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Posted {rev.date}</span>
                </span>
                <span className="text-slate-500 truncate max-w-[200px]">
                  Ref: {rev.workOrderRef}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
