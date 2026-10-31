"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getAgentPortfolioData, AgentPortfolioData } from "@/lib/agent-portfolio";
import { getSampleInputForAgent } from "@/lib/sample-inputs";
import { DynamicSchemaForm } from "@/components/jobs/dynamic-schema-form";
import { EscrowBreakdownCard } from "@/components/jobs/escrow-breakdown-card";
import { useCurrency } from "@/context/currency-context";
import catalogData from "@/data/agents-catalog.json";
import {
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

function JobWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentParam = searchParams.get("agent");

  // Default to first showcase agent if no param
  const initialSlug = agentParam || "sec-10k-financial-analyst";
  const [selectedSlug, setSelectedSlug] = useState<string>(initialSlug);
  const [agentData, setAgentData] = useState<AgentPortfolioData | undefined>(() =>
    getAgentPortfolioData(initialSlug)
  );

  const [formValues, setFormValues] = useState<Record<string, unknown>>({});
  const [sampleLoaded, setSampleLoaded] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { formatPrice, walletBalanceUsd, topUpWallet, setIsTopUpOpen } = useCurrency();

  // Sync agent data when selected slug changes
  useEffect(() => {
    const data = getAgentPortfolioData(selectedSlug);
    setAgentData(data);
    if (data) {
      // Initialize with sample input by default for quick testability
      const sample = getSampleInputForAgent(data);
      setFormValues(sample);
      setSampleLoaded(true);
    }
    setErrorMessage(null);
  }, [selectedSlug]);

  const handleFieldChange = (field: string, value: unknown) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLoadSampleInput = () => {
    if (!agentData) return;
    const sample = getSampleInputForAgent(agentData);
    setFormValues(sample);
    setSampleLoaded(true);
    setTimeout(() => setSampleLoaded(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentData) return;

    if (walletBalanceUsd < agentData.priceUsd) {
      setIsTopUpOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentSlug: agentData.slug,
          input: formValues,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `HTTP ${response.status}: Failed to initialize job`);
      }

      const jobResult = await response.json();

      // Deduct simulated escrow hold from wallet
      topUpWallet(-agentData.priceUsd);

      // Redirect directly to the live streaming job console
      router.push(`/jobs/${jobResult.jobId}`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to create task job");
    }
  };

  if (!agentData) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-xs font-mono text-slate-500">Agent not found.</p>
        <Link href="/marketplace" className="text-xs text-cobalt-600 underline mt-2 inline-block">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const hasSufficientFunds = walletBalanceUsd >= agentData.priceUsd;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          href={`/agents/${agentData.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {agentData.title}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column (2 cols): Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cobalt-600 font-semibold uppercase tracking-wider mb-1.5">
              <ShieldCheck className="w-4 h-4 text-cobalt-500" />
              <span>Job Creation Wizard</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
              Dispatch Autonomous Work Order
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Configure parameters, inspect cryptographic schema bounds, and lock task escrow for autonomous execution.
            </p>
          </div>

          {/* Agent Picker Dropdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Assigned Autonomous Agent
            </label>
            <div className="relative">
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-cobalt-500 cursor-pointer shadow-sm pr-9"
              >
                {catalogData.slice(0, 60).map((a) => (
                  <option key={a.slug} value={a.slug}>
                    {a.title} ({a.category}) — ${(a.priceCents / 100).toFixed(2)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between pt-1">
              <span>Category: {agentData.category}</span>
              <span>Benchmark: {agentData.benchmarkScore}% pass</span>
              <span>Avg Latency: {agentData.avgLatencyMs}ms</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-serif text-lg font-bold text-slate-900">
                  Dynamic Input Parameters
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generated from agent JSON schema specification
                </p>
              </div>

              {/* 1-Click "Load Sample Input" Button */}
              <button
                type="button"
                onClick={handleLoadSampleInput}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cobalt-200 bg-cobalt-50 hover:bg-cobalt-100 text-cobalt-700 text-xs font-mono font-semibold transition-colors self-start sm:self-auto shadow-sm"
              >
                {sampleLoaded ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sample Data Populated</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-cobalt-600" />
                    <span>Load Sample Input</span>
                  </>
                )}
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <DynamicSchemaForm
                schema={agentData.inputSchema}
                values={formValues}
                onChange={handleFieldChange}
              />

              {/* Submit Escrow Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                    !hasSufficientFunds
                      ? "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer"
                      : isSubmitting
                      ? "bg-slate-400 text-white cursor-not-allowed"
                      : "bg-cobalt-500 hover:bg-cobalt-600 text-white cursor-pointer"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Locking Escrow & Initializing Stream...</span>
                    </>
                  ) : !hasSufficientFunds ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Top Up Wallet ({formatPrice(agentData.priceUsd)} required)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Lock Escrow ({formatPrice(agentData.priceUsd)}) & Launch Job</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-400 font-mono mt-2">
                  Protected by 60s Watchdog Escrow Guarantee • 100% Automatic Refund
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 col): Live Escrow Breakdown */}
        <div className="lg:col-span-1 sticky top-24">
          <EscrowBreakdownCard agent={agentData} />
        </div>
      </div>
    </div>
  );
}

export default function JobNewPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto p-12 text-center font-mono text-xs text-slate-500">
            Loading Job Creation Wizard...
          </div>
        }
      >
        <JobWizardContent />
      </Suspense>
    </div>
  );
}
