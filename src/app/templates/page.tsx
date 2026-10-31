"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { STARTER_TEMPLATES, StarterTemplate } from "@/server/templates/template-definitions";
import { TemplateCard } from "@/components/templates/template-card";
import { TemplateInspectModal } from "@/components/templates/template-inspect-modal";
import {
  Code2,
  Terminal,
  Search,
  ArrowRight,
  Boxes,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [inspectingTemplate, setInspectingTemplate] = useState<StarterTemplate | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    STARTER_TEMPLATES.forEach((t) => set.add(t.category));
    return ["ALL", ...Array.from(set)];
  }, []);

  const filteredTemplates = useMemo(() => {
    return STARTER_TEMPLATES.filter((t) => {
      const matchesCategory =
        selectedCategory === "ALL" || t.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tagline.toLowerCase().includes(query) ||
        t.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleDownload = async (id: string) => {
    try {
      setDownloadingId(id);
      const response = await fetch(`/api/templates/${id}/export`);
      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}-starter.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadSuccessMessage(`Successfully packaged ${id}-starter.zip`);
      setTimeout(() => setDownloadSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Download failed";
      alert(`Export error: ${msg}`);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Banner / Hero */}
      <section className="border-b border-border-default bg-surface-primary py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-cobalt-50 text-cobalt-700 border border-cobalt-200">
                <Code2 className="w-3.5 h-3.5 text-cobalt-600" />
                <span>Production TypeScript Starters</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
                Downloadable Agent Templates Hub
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Production-grade scaffolding for autonomous enterprise agents. Each starter includes strict input validation, deterministic execution harnesses, cryptographic evidence receipts, and automated test suites.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/builder/overview"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Creator Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick CLI Scaffolding Prompt Box */}
          <div className="mt-8 p-4 rounded-xl border border-slate-200 bg-slate-900 text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-cobalt-400 flex items-center justify-center shrink-0">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Instant 1-Click Curl Export:</span>
                <span className="text-cobalt-300 select-all font-semibold">
                  curl -O https://forgent.network/api/templates/financial-auditor/export &amp;&amp; unzip financial-auditor-starter.zip
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Includes package.json, tsconfig.json, src/index.ts, .env.example, README.md</span>
            </div>
          </div>

          {downloadSuccessMessage && (
            <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{downloadSuccessMessage}</span>
            </div>
          )}
        </div>
      </section>

      {/* Main Filter & Gallery Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Controls Bar: Search & Category Filters */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-cobalt-500 text-white font-semibold shadow-sm"
                    : "bg-surface-primary border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {cat === "ALL" ? "All Categories (5)" : cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates or tags..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-surface-primary text-xs text-foreground placeholder:text-slate-400 focus:outline-none focus:border-cobalt-500 transition-colors"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onInspect={(t) => setInspectingTemplate(t)}
              onDownload={handleDownload}
              isDownloading={downloadingId === template.id}
            />
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="p-12 text-center rounded-xl border border-dashed border-slate-300 bg-surface-primary space-y-3">
            <Boxes className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-base font-semibold text-slate-800">No matching templates found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or resetting category filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
              }}
              className="px-3.5 py-1.5 rounded-lg bg-cobalt-500 text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Code Inspection Modal */}
      {inspectingTemplate && (
        <TemplateInspectModal
          template={inspectingTemplate}
          onClose={() => setInspectingTemplate(null)}
          onDownload={handleDownload}
          isDownloading={downloadingId === inspectingTemplate.id}
        />
      )}
    </div>
  );
}
