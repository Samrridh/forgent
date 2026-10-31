"use client";

import React, { useState, useRef, useEffect } from "react";
import { AGENTS_DATASET, searchAgents } from "@/data/agents";
import { Agent, AgentCategory, AGENT_CATEGORIES } from "@/types/agent";
import {
  Search,
  Check,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";

interface SandboxAgentSelectorProps {
  selectedAgent: Agent;
  onSelectAgent: (agent: Agent) => void;
}

export function SandboxAgentSelector({
  selectedAgent,
  onSelectAgent,
}: SandboxAgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory | "ALL">("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter 500 catalog agents
  const filteredAgents = React.useMemo(() => {
    let pool = AGENTS_DATASET;
    if (selectedCategory !== "ALL") {
      pool = pool.filter((a) => a.category === selectedCategory);
    }
    return searchAgents(query, pool).slice(0, 40);
  }, [query, selectedCategory]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Agent Display Card & Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-200 hover:border-cobalt-400 rounded-xl p-4 cursor-pointer transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-cobalt-500 text-white flex items-center justify-center font-serif text-lg font-bold shrink-0 shadow-xs">
            {selectedAgent.title.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm truncate">
                {selectedAgent.title}
              </span>
              {selectedAgent.verified && (
                <ShieldCheck className="w-4 h-4 text-cobalt-600 shrink-0" />
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cobalt-50 text-cobalt-700 border border-cobalt-200 font-bold">
                {selectedAgent.category}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedAgent.version}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate max-w-xl mt-0.5">
              {selectedAgent.bio}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 sm:self-center self-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <div className="text-right">
            <div className="text-xs font-semibold font-mono text-slate-900">
              ${selectedAgent.pricePerTaskUsd.toFixed(2)} / ₹{selectedAgent.pricePerTaskInr}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Score: {selectedAgent.benchmarkScore}% • {selectedAgent.latencyMs}ms
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-porcelain-200 border border-slate-200 flex items-center justify-center text-slate-600">
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </div>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Search Bar & Category Filter */}
          <div className="p-3 bg-porcelain-100 border-b border-slate-200 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search across 500 verified agents by title, slug, or capabilities..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-cobalt-500"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory("ALL")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === "ALL"
                    ? "bg-cobalt-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                All (500)
              </button>
              {AGENT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-cobalt-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Results List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
            {filteredAgents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No agents match the specified search parameters.
              </div>
            ) : (
              filteredAgents.map((agent) => {
                const isSelected = agent.slug === selectedAgent.slug;
                return (
                  <div
                    key={agent.id}
                    onClick={() => {
                      onSelectAgent(agent);
                      setIsOpen(false);
                    }}
                    className={`p-3 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-cobalt-50/70 text-cobalt-950 font-medium"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {agent.title}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {agent.category}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {agent.creatorHandle}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {agent.bio}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-mono font-semibold text-slate-900">
                          ${agent.pricePerTaskUsd.toFixed(2)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          ₹{agent.pricePerTaskInr}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-cobalt-600 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
