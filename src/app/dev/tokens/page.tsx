import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function TokenPreviewPage() {
  return (
    <div className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-cobalt-50 text-cobalt-600 border border-cobalt-200">
              Forgent Bespoke Brand Tokens
            </span>
            <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Verified Spec
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Brand Identity & Design Tokens
          </h1>
          <p className="text-sm text-slate-600 mt-1 font-sans">
            Bespoke brand tokens: Porcelain White base, Deep Royal Cobalt, Vibrant Azure, and High-contrast Dark text.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/marketplace"
            className="px-4 py-2 bg-cobalt-500 hover:bg-cobalt-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Marketplace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/buyer/overview"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Enterprise Hub
          </Link>
        </div>
      </div>

      {/* 1. Core Brand Palette */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span>1. Bespoke Brand Palette</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div className="w-full h-16 rounded-lg bg-[#F5F9FD] border border-slate-200 flex items-center justify-center font-mono text-xs text-slate-600">
              #F5F9FD
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Porcelain White</div>
              <div className="text-xs font-mono text-slate-500">Base viewport canvas</div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div className="w-full h-16 rounded-lg bg-[#0B4FBA] flex items-center justify-center font-mono text-xs text-white font-semibold">
              #0B4FBA
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Deep Royal Cobalt</div>
              <div className="text-xs font-mono text-slate-500">Primary brand & action accent</div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div className="w-full h-16 rounded-lg bg-[#5EA2FF] flex items-center justify-center font-mono text-xs text-slate-950 font-semibold">
              #5EA2FF
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Vibrant Azure</div>
              <div className="text-xs font-mono text-slate-500">Secondary highlight token</div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
            <div className="w-full h-16 rounded-lg bg-[#0F172A] flex items-center justify-center font-mono text-xs text-white font-semibold">
              #0F172A
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">High-Contrast Dark</div>
              <div className="text-xs font-mono text-slate-500">Primary body & heading text</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Typography Pairing */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span>2. Typography Pairing</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cobalt-600 font-semibold">
              Italiana — Editorial Serif Headings
            </span>
            <div className="font-serif text-3xl font-bold text-slate-900 leading-tight">
              The Verified AI Agent Marketplace
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Font family: &quot;Italiana&quot;, Georgia, serif
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cobalt-600 font-semibold">
              Jeju Gothic — Crisp UI / Sans Body
            </span>
            <div className="font-sans text-base text-slate-800 leading-relaxed">
              Hire autonomous agents on demand. Pay per task. Cryptographically verified with formal benchmark audits.
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Font family: &quot;Jeju Gothic&quot;, -apple-system, sans-serif
            </p>
          </div>
        </div>
      </section>

      {/* 3. Currency & Ledger Formats */}
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <span>3. Dual-Currency Display Format</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
            <span className="text-xs font-mono text-slate-500">USD Task Ledger ($)</span>
            <div className="text-2xl font-bold font-mono text-slate-900">$50.00</div>
            <p className="text-xs text-slate-500">Integer cents formatting with strict float safety</p>
          </div>
          <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
            <span className="text-xs font-mono text-slate-500">INR Task Ledger (₹)</span>
            <div className="text-2xl font-bold font-mono text-slate-900">₹4,000</div>
            <p className="text-xs text-slate-500">Indian Rupee (1 USD = 80 INR) locale formatting</p>
          </div>
        </div>
      </section>
    </div>
  );
}
