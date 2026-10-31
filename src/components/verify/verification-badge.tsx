"use client";

import React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
} from "lucide-react";

interface VerificationBadgeProps {
  valid: boolean;
  calculatedHash: string;
  providedHash: string;
  verifiedAt: string;
  error?: string;
}

export function VerificationBadge({
  valid,
  calculatedHash,
  providedHash,
  verifiedAt,
  error,
}: VerificationBadgeProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(calculatedHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`border rounded-2xl p-6 shadow-sm space-y-4 ${
        valid
          ? "bg-emerald-50/70 border-emerald-300"
          : "bg-red-50/70 border-red-300"
      }`}
    >
      {/* Top Status Stamp */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
              valid
                ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                : "bg-red-100 text-red-700 border-red-300"
            }`}
          >
            {valid ? (
              <ShieldCheck className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>
          <div>
            <div
              className={`text-xs font-mono uppercase tracking-wider font-bold ${
                valid ? "text-emerald-800" : "text-red-800"
              }`}
            >
              {valid
                ? "CRYPTOGRAPHIC EVIDENCE VERIFIED"
                : "CRYPTOGRAPHIC VERIFICATION FAILED"}
            </div>
            <div className="text-sm font-serif font-bold text-slate-900 mt-0.5">
              {valid
                ? "Deterministic SHA-256 Integrity Match Confirmed"
                : "Tampered or Malformed Evidence Receipt"}
            </div>
          </div>
        </div>

        <div className="text-right font-mono text-[11px] text-slate-500 self-start sm:self-auto">
          <span>Verified: {new Date(verifiedAt).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Hash Comparison Details */}
      <div className="bg-white/90 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-xs">
        <div>
          <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
            <span>Computed Canonical SHA-256 Digest:</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 text-[10px]"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="p-2.5 bg-slate-900 text-slate-100 rounded-lg text-xs break-all border border-slate-800">
            {calculatedHash || "Calculation failed"}
          </div>
        </div>

        <div>
          <div className="text-slate-500 text-[11px] mb-1">
            Provided Receipt Integrity Hash:
          </div>
          <div
            className={`p-2.5 rounded-lg text-xs break-all border ${
              valid
                ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                : "bg-red-50 text-red-900 border-red-200 line-through"
            }`}
          >
            {providedHash}
          </div>
        </div>

        {!valid && error && (
          <div className="p-2.5 bg-red-100 text-red-900 rounded-lg text-xs font-mono font-medium">
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}
