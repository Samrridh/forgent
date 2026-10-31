"use client";

import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  totalMatches: number;
  onToggleSidebar?: () => void;
  showMobileFilterButton?: boolean;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search 500 agents by capability, title, tag, or creator handle...",
  totalMatches,
  onToggleSidebar,
  showMobileFilterButton = false,
}: SearchBarProps) {
  return (
    <div className="relative w-full flex items-center gap-2">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-24 py-2.5 text-sm bg-white border border-slate-200 rounded-xl placeholder:text-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 focus:border-transparent transition-all shadow-sm"
        />

        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute inset-y-0 right-20 pr-1 flex items-center text-slate-400 hover:text-slate-600"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-xs font-mono text-slate-400">
          <span>{totalMatches} found</span>
        </div>
      </div>

      {showMobileFilterButton && onToggleSidebar && (
        <button
          type="button"
          onClick={onToggleSidebar}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl shadow-sm transition-colors"
          aria-label="Toggle filter facets"
        >
          <SlidersHorizontal className="w-4 h-4 text-cobalt-500" />
          <span>Filters</span>
        </button>
      )}
    </div>
  );
}
