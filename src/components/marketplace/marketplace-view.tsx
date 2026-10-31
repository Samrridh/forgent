"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AgentCategory, AgentSortOption, AGENT_CATEGORIES } from "@/types/agent";
import { AGENTS_DATASET, searchAgents } from "@/data/agents";
import { AgentCard } from "./agent-card";
import { CategoryPills } from "./category-pills";
import { SearchBar } from "./search-bar";
import { FacetsSidebar } from "./facets-sidebar";
import {
  ChevronLeft,
  ChevronRight,
  FilterX,
  X,
  SlidersHorizontal,
} from "lucide-react";

interface MarketplaceViewProps {
  initialCategory?: AgentCategory | "ALL";
  showCategoryPills?: boolean;
}

export function MarketplaceView({
  initialCategory = "ALL",
  showCategoryPills = true,
}: MarketplaceViewProps) {
  const searchParams = useSearchParams();
  const urlCategory = searchParams.get("category") as AgentCategory | null;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<AgentCategory | "ALL">(
    urlCategory && AGENT_CATEGORIES.includes(urlCategory) ? urlCategory : initialCategory
  );
  const [maxPriceUsd, setMaxPriceUsd] = useState<number>(15.0);
  const [minRating, setMinRating] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<AgentSortOption>("recommended");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  const PAGE_SIZE = 24;

  // Sync category if URL parameter changes
  useEffect(() => {
    if (urlCategory && AGENT_CATEGORIES.includes(urlCategory)) {
      setActiveCategory(urlCategory);
      setCurrentPage(1);
    }
  }, [urlCategory]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const agent of AGENTS_DATASET) {
      counts[agent.category] = (counts[agent.category] || 0) + 1;
    }
    return counts;
  }, []);

  // Filter and sort agents
  const filteredAgents = useMemo(() => {
    let result = AGENTS_DATASET;

    // 1. Category Filter
    if (activeCategory !== "ALL") {
      result = result.filter((a) => a.category === activeCategory);
    }

    // 2. Search Query (Fuzzy match)
    if (searchQuery.trim()) {
      result = searchAgents(searchQuery, result);
    }

    // 3. Price Filter
    if (maxPriceUsd < 15.0) {
      result = result.filter((a) => a.pricePerTaskUsd <= maxPriceUsd);
    }

    // 4. Rating Filter
    if (minRating > 0) {
      result = result.filter((a) => a.rating >= minRating);
    }

    // 5. Verified Filter
    if (verifiedOnly) {
      result = result.filter((a) => a.verified);
    }

    // 6. Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "rating-desc":
          return b.rating - a.rating;
        case "tasks-desc":
          return b.tasksCompleted - a.tasksCompleted;
        case "price-asc":
          return a.pricePerTaskUsd - b.pricePerTaskUsd;
        case "price-desc":
          return b.pricePerTaskUsd - a.pricePerTaskUsd;
        case "latency-asc":
          return a.latencyMs - b.latencyMs;
        case "recommended":
        default:
          if (a.verified !== b.verified) return a.verified ? -1 : 1;
          return b.benchmarkScore * b.rating - a.benchmarkScore * a.rating;
      }
    });

    return result;
  }, [activeCategory, searchQuery, maxPriceUsd, minRating, verifiedOnly, sortBy]);

  // Reset page when filters change
  const handleCategorySelect = (cat: AgentCategory | "ALL") => {
    setActiveCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setActiveCategory("ALL");
    setMaxPriceUsd(15.0);
    setMinRating(0);
    setVerifiedOnly(false);
    setSortBy("recommended");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    activeCategory !== "ALL" ||
    maxPriceUsd < 15.0 ||
    minRating > 0 ||
    verifiedOnly ||
    sortBy !== "recommended";

  // Pagination slice
  const totalMatches = filteredAgents.length;
  const totalPages = Math.ceil(totalMatches / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const displayedAgents = filteredAgents.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="w-full space-y-6">
      {/* 12 Industry Domain Category Filter Pills */}
      {showCategoryPills && (
        <div className="pt-2">
          <CategoryPills
            activeCategory={activeCategory}
            onSelectCategory={handleCategorySelect}
            categoryCounts={categoryCounts}
          />
        </div>
      )}

      {/* Instant Search Bar */}
      <div>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          totalMatches={totalMatches}
          showMobileFilterButton={true}
          onToggleSidebar={() => setIsMobileFiltersOpen(true)}
        />
      </div>

      {/* Main Faceted Content Layout: Sidebar + Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block lg:w-72 shrink-0 sticky top-20">
          <FacetsSidebar
            maxPriceUsd={maxPriceUsd}
            onMaxPriceChange={(p) => {
              setMaxPriceUsd(p);
              setCurrentPage(1);
            }}
            minRating={minRating}
            onMinRatingChange={(r) => {
              setMinRating(r);
              setCurrentPage(1);
            }}
            verifiedOnly={verifiedOnly}
            onVerifiedOnlyChange={(v) => {
              setVerifiedOnly(v);
              setCurrentPage(1);
            }}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            onResetFilters={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            matchingCount={totalMatches}
          />
        </div>

        {/* Mobile Filters Drawer Modal */}
        {isMobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-sm">
            <div className="relative w-full max-w-xs bg-white h-full p-5 overflow-y-auto shadow-2xl ml-auto flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-cobalt-500" />
                    <span className="text-sm font-bold text-slate-900">Filter Facets</span>
                  </div>
                  <button
                    onClick={() => setIsMobileFiltersOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <FacetsSidebar
                  maxPriceUsd={maxPriceUsd}
                  onMaxPriceChange={(p) => {
                    setMaxPriceUsd(p);
                    setCurrentPage(1);
                  }}
                  minRating={minRating}
                  onMinRatingChange={(r) => {
                    setMinRating(r);
                    setCurrentPage(1);
                  }}
                  verifiedOnly={verifiedOnly}
                  onVerifiedOnlyChange={(v) => {
                    setVerifiedOnly(v);
                    setCurrentPage(1);
                  }}
                  sortBy={sortBy}
                  onSortByChange={setSortBy}
                  onResetFilters={handleResetFilters}
                  hasActiveFilters={hasActiveFilters}
                  matchingCount={totalMatches}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-sm"
                >
                  Apply Filters ({totalMatches})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Agent Grid & Results Header */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Results Summary Bar */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-mono">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {totalMatches > 0 ? startIndex + 1 : 0}–
                {Math.min(startIndex + PAGE_SIZE, totalMatches)}
              </span>{" "}
              of <span className="font-semibold text-slate-900">{totalMatches}</span> agents
              {activeCategory !== "ALL" && (
                <span>
                  {" "}
                  in <span className="text-cobalt-600 font-medium">{activeCategory}</span>
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-cobalt-600 hover:underline flex items-center gap-1 font-medium"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {/* Agent Cards Grid */}
          {displayedAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {displayedAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <FilterX className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                No Agents Match Your Criteria
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try widening your search terms, raising the maximum price, or resetting the active filters.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <span>Reset All Filters</span>
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
              <div className="text-xs font-mono text-slate-500">
                Page <span className="font-semibold text-slate-900">{currentPage}</span> of{" "}
                <span className="font-semibold text-slate-900">{totalPages}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page number buttons */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-medium border transition-colors ${
                        isActive
                          ? "bg-cobalt-500 text-white border-cobalt-500 font-bold"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
