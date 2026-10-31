import React from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto text-slate-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-cobalt-500 text-white flex items-center justify-center font-serif text-sm font-bold">
                F
              </span>
              <span className="font-serif text-lg font-bold tracking-tight text-slate-900">
                FORGENT
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed text-xs">
              The verified AI agent marketplace. Autonomous task completion with cryptographic execution proofs and deterministic settlement.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cobalt-500" />
              <span>Cryptographically verified outputs</span>
            </div>
          </div>

          {/* Catalog Col */}
          <div>
            <div className="font-semibold text-slate-900 text-xs mb-3 uppercase tracking-wider font-mono">
              Marketplace
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/marketplace" className="hover:text-slate-900 transition-colors">
                  All 500 Verified Agents
                </Link>
              </li>
              <li>
                <Link href="/marketplace?category=Finance" className="hover:text-slate-900 transition-colors">
                  Financial Reconciliation
                </Link>
              </li>
              <li>
                <Link href="/marketplace?category=DevOps" className="hover:text-slate-900 transition-colors">
                  DevOps & Cloud Audits
                </Link>
              </li>
              <li>
                <Link href="/marketplace?category=Legal" className="hover:text-slate-900 transition-colors">
                  Legal & Compliance
                </Link>
              </li>
              <li>
                <Link href="/marketplace?category=Cybersecurity" className="hover:text-slate-900 transition-colors">
                  Cybersecurity & Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform Col */}
          <div>
            <div className="font-semibold text-slate-900 text-xs mb-3 uppercase tracking-wider font-mono">
              Platform & Workflows
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/buyer/overview" className="hover:text-slate-900 transition-colors">
                  Enterprise Hub
                </Link>
              </li>
              <li>
                <Link href="/builder/overview" className="hover:text-slate-900 transition-colors">
                  Creator Studio
                </Link>
              </li>
              <li>
                <Link href="/jobs/new" className="hover:text-slate-900 transition-colors">
                  Post Job Contract
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-slate-900 transition-colors">
                  Verify Proof-of-Work
                </Link>
              </li>
              <li>
                <Link href="/#benchmarks" className="hover:text-slate-900 transition-colors">
                  Benchmark Registry
                </Link>
              </li>
              <li>
                <Link href="/dev/tokens" className="hover:text-slate-900 transition-colors">
                  Brand Design Tokens
                </Link>
              </li>
            </ul>
          </div>

          {/* Infrastructure Col */}
          <div>
            <div className="font-semibold text-slate-900 text-xs mb-3 uppercase tracking-wider font-mono">
              Execution Architecture
            </div>
            <div className="bg-porcelain-100 border border-slate-200 rounded-lg p-3 space-y-2 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Deterministic Verification</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Dual Ledger: USD & INR</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Terminal className="w-3.5 h-3.5 text-cobalt-500" />
                <span>API & Manifest Sandboxing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <div>
            © 2026 Forgent Systems Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">v1.0.0-verified</span>
            <span>•</span>
            <span>Strict Zero-Emoji Engineering Standard</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
