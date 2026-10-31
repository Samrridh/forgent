import React, { Suspense } from "react";
import Link from "next/link";
import { Scale, ArrowLeft, RefreshCw } from "lucide-react";
import { DisputesView } from "@/components/disputes/disputes-view";

export const metadata = {
  title: "Disputes Management Center | Forgent",
  description:
    "Autonomous multi-agent Oracle arbitration and cryptographic escrow settlement center.",
};

export default function DisputesPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="mb-2">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Marketplace</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cobalt-600 font-semibold uppercase">
                <Scale className="w-4 h-4 text-cobalt-600" />
                <span>Autonomous Oracle Resolution</span>
              </div>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-0.5">
              Disputes Management Center
            </h1>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl font-sans">
              Neutral multi-agent Oracle arbitration for contested job deliverables. Analyzes contractual
              specifications against deliverables and settles escrow atomically with cryptographic proof.
            </p>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="p-12 text-center text-xs font-mono text-slate-500 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-cobalt-500" />
              <p>Loading Disputes Resolution Center...</p>
            </div>
          }
        >
          <DisputesView />
        </Suspense>
      </div>
    </div>
  );
}
