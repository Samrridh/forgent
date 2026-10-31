"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { VerificationBadge } from "@/components/verify/verification-badge";
import { AuditTrailCard } from "@/components/verify/audit-trail-card";
import { EvidenceReceipt } from "@/server/engine/receipt";
import {
  ShieldCheck,
  Search,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Hash,
} from "lucide-react";

interface VerificationState {
  valid: boolean;
  calculatedHash: string;
  providedHash: string;
  verifiedAt: string;
  receiptId?: string;
  jobId?: string;
  agentSlug?: string;
  receipt?: EvidenceReceipt;
  error?: string;
}

const SAMPLE_HASHES = [
  {
    label: "SEC 10-K Audit (NVDA)",
    hash: "65f35fd2e5a1ee98544b77368891b442b688ef47e423ed4a6802c845209e540f",
  },
  {
    label: "Invoice 3-Way Match",
    hash: "af69bd6417490d89a8619758b496658f1c5ad61886e17dc7b7bb16168a617bfe",
  },
  {
    label: "Corporate Tax Withholding",
    hash: "843de87ace35dd7e8c11f67d748d0dd4365edde3e7c03b5ae20a8e8718c93b14",
  },
];

function VerifyContent() {
  const searchParams = useSearchParams();
  const urlHash = searchParams.get("hash") || searchParams.get("receiptId") || searchParams.get("jobId");

  const [query, setQuery] = useState<string>(urlHash || SAMPLE_HASHES[0].hash);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performVerification = async (searchTarget: string) => {
    const trimmed = searchTarget.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Check if user pasted a JSON receipt directly
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        const parsed = JSON.parse(trimmed);
        const postRes = await fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed),
        });
        const postJson = await postRes.json();
        setResult(postJson);
        setIsLoading(false);
        return;
      }

      // Query via GET with hash or ID
      const queryParam = trimmed.startsWith("rcpt_")
        ? `receiptId=${encodeURIComponent(trimmed)}`
        : trimmed.startsWith("job_")
        ? `jobId=${encodeURIComponent(trimmed)}`
        : `hash=${encodeURIComponent(trimmed)}`;

      const res = await fetch(`/api/verify?${queryParam}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || `Verification failed (HTTP ${res.status})`);
      }

      setResult(json);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to verify receipt hash");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Run on mount or if query params change
  useEffect(() => {
    if (urlHash) {
      setQuery(urlHash);
      performVerification(urlHash);
    } else {
      performVerification(SAMPLE_HASHES[0].hash);
    }
  }, [urlHash]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(query);
  };

  const handleSelectSample = (sampleHash: string) => {
    setQuery(sampleHash);
    performVerification(sampleHash);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Marketplace</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cobalt-600 font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-cobalt-500" />
            <span>Public Evidence Inspector</span>
          </div>
        </div>
        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">
          Verify Cryptographic Proof-of-Work
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
          Inspect, recompute, and audit the cryptographic SHA-256 evidence receipt for any completed work order. Verifies that outputs, runtime prompts, and input payloads remain untampered.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 font-semibold">
            Paste SHA-256 Hash, Receipt ID, or JSON Envelope
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Paste 64-character SHA-256 hash or rcpt_..."
                required
                className="w-full px-4 py-2.5 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cobalt-500 shadow-sm pr-9"
              />
              <Hash className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-5 rounded-xl bg-cobalt-500 hover:bg-cobalt-600 text-white font-mono text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Inspect Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* 1-Click Verified Samples */}
        <div className="pt-3 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-mono uppercase text-slate-400 block font-semibold">
            Or Click a Pre-Audited Verified Sample:
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_HASHES.map((sample) => (
              <button
                key={sample.hash}
                type="button"
                onClick={() => handleSelectSample(sample.hash)}
                className={`text-[11px] font-mono px-3 py-1.5 rounded-lg border transition-all text-left ${
                  query === sample.hash
                    ? "bg-cobalt-50 border-cobalt-300 text-cobalt-800 font-semibold"
                    : "bg-porcelain-100 hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <span>{sample.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-mono text-red-700 flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Verification Record Not Found</div>
            <div className="text-[11px] text-red-600 leading-relaxed">
              {errorMessage}
            </div>
          </div>
        </div>
      )}

      {/* Verification Results Display */}
      {result && (
        <div className="space-y-6">
          <VerificationBadge
            valid={result.valid}
            calculatedHash={result.calculatedHash}
            providedHash={result.providedHash}
            verifiedAt={result.verifiedAt}
            error={result.error}
          />

          {result.receipt && (
            <AuditTrailCard
              receipt={result.receipt}
              jobId={result.jobId}
              agentSlug={result.agentSlug}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto p-12 text-center font-mono text-xs text-slate-500">
            Loading Verification Inspector...
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
