"use client";

import React from "react";
import { AgentCategory, AGENT_CATEGORIES } from "@/types/agent";
import {
  Layers,
  Coins,
  Scale,
  Server,
  Activity,
  Database,
  FileText,
  Headphones,
  Users,
  Shield,
  ShoppingBag,
  Search,
  TrendingUp,
} from "lucide-react";

interface CategoryPillsProps {
  activeCategory: AgentCategory | "ALL";
  onSelectCategory: (category: AgentCategory | "ALL") => void;
  categoryCounts?: Record<string, number>;
}

const CATEGORY_ICONS: Record<
  AgentCategory | "ALL",
  React.ComponentType<{ className?: string }>
> = {
  ALL: Layers,
  Finance: Coins,
  Legal: Scale,
  DevOps: Server,
  Healthcare: Activity,
  Data: Database,
  Copywriting: FileText,
  "Customer Support": Headphones,
  HR: Users,
  Cybersecurity: Shield,
  "E-Commerce": ShoppingBag,
  Research: Search,
  Growth: TrendingUp,
};

export function CategoryPills({
  activeCategory,
  onSelectCategory,
  categoryCounts = {},
}: CategoryPillsProps) {
  const allCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0) || 500;

  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max">
        {/* All Domains Pill */}
        <button
          type="button"
          onClick={() => onSelectCategory("ALL")}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
            activeCategory === "ALL"
              ? "bg-cobalt-500 text-white border-cobalt-500 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <Layers className={`w-3.5 h-3.5 ${activeCategory === "ALL" ? "text-white" : "text-slate-500"}`} />
          <span>All Domains</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeCategory === "ALL"
                ? "bg-white/20 text-white"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {allCount}
          </span>
        </button>

        {/* 12 Category Filter Pills */}
        {AGENT_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || Layers;
          const isSelected = activeCategory === cat;
          const count = categoryCounts[cat] ?? 42;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isSelected
                  ? "bg-cobalt-500 text-white border-cobalt-500 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-500"}`} />
              <span>{cat}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
