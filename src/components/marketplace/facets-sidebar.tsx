"use client";

import React from "react";
import { AgentSortOption } from "@/types/agent";
import { useCurrency } from "@/context/currency-context";
import {
  ShieldCheck,
  Star,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
} from "lucide-react";

interface FacetsSidebarProps {
  maxPriceUsd: number;
  onMaxPriceChange: (price: number) => void;
  minRating: number;
  onMinRatingChange: (rating: number) => void;
  verifiedOnly: boolean;
  onVerifiedOnlyChange: (verified: boolean) => void;
  sortBy: AgentSortOption;
  onSortByChange: (sort: AgentSortOption) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  matchingCount: number;
}

export function FacetsSidebar({
  maxPriceUsd,
  onMaxPriceChange,
  minRating,
  onMinRatingChange,
  verifiedOnly,
  onVerifiedOnlyChange,
  sortBy,
  onSortByChange,
  onResetFilters,
  hasActiveFilters,
  matchingCount,
}: FacetsSidebarProps) {
  const { currency, exchangeRate, formatPrice } = useCurrency();

  const currentFormattedMax = formatPrice(maxPriceUsd);
  const minSliderFormatted = formatPrice(0.5);

  const ratingOptions = [
    { label: "Any Rating", value: 0 },
    { label: "4.0+ Stars", value: 4.0 },
    { label: "4.5+ Stars", value: 4.5 },
    { label: "4.8+ Stars", value: 4.8 },
  ];

  const sortOptions: { label: string; value: AgentSortOption }[] = [
    { label: "Recommended", value: "recommended" },
    { label: "Highest Rated", value: "rating-desc" },
    { label: "Most Tasks Completed", value: "tasks-desc" },
    { label: "Price: Low to High", value: "price-asc" },
    { label: "Price: High to Low", value: "price-desc" },
    { label: "Lowest Latency", value: "latency-asc" },
  ];

  return (
    <aside className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
      {/* Header & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-cobalt-500" />
          <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-900">
            Faceted Filters
          </h2>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-cobalt-600 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Sort By Dropdown */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span>Sort By</span>
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as AgentSortOption)}
          className="w-full px-3 py-2 text-xs font-medium bg-porcelain-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-cobalt-500 transition-colors cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Max Price per Task</span>
          </label>
          <span className="font-mono text-xs font-bold text-cobalt-600 bg-cobalt-50 px-2 py-0.5 rounded border border-cobalt-100">
            {currentFormattedMax}
          </span>
        </div>

        <input
          type="range"
          min="0.5"
          max="15.0"
          step="0.5"
          value={maxPriceUsd}
          onChange={(e) => onMaxPriceChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cobalt-500"
        />

        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1.5">
          <span>{minSliderFormatted}</span>
          <span>{formatPrice(7.5)}</span>
          <span>{formatPrice(15.0)}</span>
        </div>

        {/* Quick price presets */}
        <div className="grid grid-cols-4 gap-1.5 mt-2.5">
          {[2, 5, 10, 15].map((usd) => {
            const isSelected = maxPriceUsd === usd;
            return (
              <button
                key={usd}
                type="button"
                onClick={() => onMaxPriceChange(usd)}
                className={`py-1 text-center font-mono text-[11px] rounded border transition-colors ${
                  isSelected
                    ? "bg-cobalt-500 text-white border-cobalt-500 font-semibold"
                    : "bg-porcelain-100 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {currency === "USD" ? `≤$${usd}` : `≤₹${usd * exchangeRate}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Verified Benchmark Toggle */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-semibold text-slate-800 group-hover:text-cobalt-600 transition-colors">
                Verified Benchmark Only
              </div>
              <div className="text-[11px] text-slate-500">
                Audited against test suites
              </div>
            </div>
          </div>

          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => onVerifiedOnlyChange(e.target.checked)}
            className="w-4 h-4 rounded text-cobalt-500 focus:ring-cobalt-400 border-slate-300 cursor-pointer"
          />
        </label>
      </div>

      {/* Minimum Rating */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-2">
          <Star className="w-3.5 h-3.5 text-amber-500" />
          <span>Minimum Rating</span>
        </label>
        <div className="space-y-1.5">
          {ratingOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                minRating === option.value
                  ? "bg-cobalt-50 border-cobalt-200 text-cobalt-900 font-semibold"
                  : "bg-white border-slate-100 hover:bg-slate-50 text-slate-700"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="min-rating"
                  checked={minRating === option.value}
                  onChange={() => onMinRatingChange(option.value)}
                  className="text-cobalt-500 focus:ring-cobalt-400 cursor-pointer"
                />
                <span>{option.label}</span>
              </div>
              {option.value > 0 && (
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                </div>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Summary Badge */}
      <div className="p-3 bg-porcelain-100 rounded-xl border border-slate-200/80 text-center font-mono text-xs text-slate-600">
        <div>Matching Agents</div>
        <div className="text-lg font-bold text-slate-900 mt-0.5">
          {matchingCount} <span className="text-xs font-normal text-slate-400">/ 500</span>
        </div>
      </div>
    </aside>
  );
}
