"use client";

import React, { useState } from "react";
import { PublishWizardForm } from "../creator-types";
import {
  FileJson,
  Calculator,
  Percent,
  CheckCircle2,
  AlertCircle,
  Coins,
} from "lucide-react";

interface StepTaskContractProps {
  formData: PublishWizardForm;
  onChange: (fields: Partial<PublishWizardForm>) => void;
}

const MIN_PRICE_USD = 0.50;
const MAX_PRICE_USD = 50.00;

export function StepTaskContract({ formData, onChange }: StepTaskContractProps) {
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const priceUsd = formData.pricePerTaskUsd || MIN_PRICE_USD;
  const priceInr = Math.round(priceUsd * 80);

  // Revenue split calculations (85% Creator / 15% Network Protocol)
  const creatorShareUsd = priceUsd * 0.85;
  const creatorShareInr = Math.round(creatorShareUsd * 80);
  const networkShareUsd = priceUsd * 0.15;
  const networkShareInr = Math.round(networkShareUsd * 80);

  const isPriceValid = priceUsd >= MIN_PRICE_USD && priceUsd <= MAX_PRICE_USD;

  const handlePriceChange = (val: number) => {
    const clamped = Math.max(MIN_PRICE_USD, Math.min(MAX_PRICE_USD, val));
    onChange({ pricePerTaskUsd: Number(clamped.toFixed(2)) });
  };

  const handleSchemaValidate = (text: string, field: "inputSchema" | "outputFormat") => {
    try {
      JSON.parse(text);
      setSchemaError(null);
      onChange({ [field]: text });
    } catch {
      setSchemaError(`JSON Syntax Error in ${field === "inputSchema" ? "Input Schema" : "Output Format"}`);
      onChange({ [field]: text });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border-subtle pb-4">
        <h3 className="text-base font-bold text-slate-900">Step 2: Task Contract &amp; Pricing Economics</h3>
        <p className="text-xs text-slate-500 mt-1">
          Specify input validation schemas, deliverable response shapes, and per-task fee with live 85/15 revenue split.
        </p>
      </div>

      {/* Schemas Layout: Input & Output */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input Schema */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-cobalt-600" />
              <span>Input Contract Schema (JSON) *</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">Strict JSON</span>
          </div>
          <textarea
            value={formData.inputSchema}
            onChange={(e) => handleSchemaValidate(e.target.value, "inputSchema")}
            rows={7}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-950 text-slate-100 font-mono text-xs focus:outline-none focus:border-cobalt-500 leading-relaxed"
          />
        </div>

        {/* Deliverable Format */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-cobalt-600" />
              <span>Output Deliverable Format (JSON) *</span>
            </label>
            <span className="text-[11px] font-mono text-slate-400">Deterministic</span>
          </div>
          <textarea
            value={formData.outputFormat}
            onChange={(e) => handleSchemaValidate(e.target.value, "outputFormat")}
            rows={7}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-950 text-slate-100 font-mono text-xs focus:outline-none focus:border-cobalt-500 leading-relaxed"
          />
        </div>
      </div>

      {schemaError && (
        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{schemaError}</span>
        </div>
      )}

      {/* Per-Task Pricing Section */}
      <div className="p-5 rounded-xl border border-border-default bg-porcelain-50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-cobalt-600" />
              <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">
                Per-Task Execution Price
              </h4>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Platform bounds: $0.50 - $50.00 / ₹40 - ₹4,000 per verified task.
            </p>
          </div>

          <div className="flex items-baseline gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 font-mono">
            <span className="text-base font-bold text-slate-900">
              ${priceUsd.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500">
              (₹{priceInr.toLocaleString("en-IN")})
            </span>
          </div>
        </div>

        {/* Pricing Slider & Number Input */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div className="sm:col-span-3">
            <input
              type="range"
              min={MIN_PRICE_USD}
              max={MAX_PRICE_USD}
              step={0.25}
              value={priceUsd}
              onChange={(e) => handlePriceChange(parseFloat(e.target.value))}
              className="w-full accent-cobalt-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
              <span>$0.50 (₹40)</span>
              <span>$25.00 (₹2,000)</span>
              <span>$50.00 (₹4,000)</span>
            </div>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
              $
            </span>
            <input
              type="number"
              min={MIN_PRICE_USD}
              max={MAX_PRICE_USD}
              step={0.10}
              value={priceUsd}
              onChange={(e) => handlePriceChange(parseFloat(e.target.value) || MIN_PRICE_USD)}
              className="w-full pl-6 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:border-cobalt-500"
            />
          </div>
        </div>

        {!isPriceValid && (
          <p className="text-xs text-red-600 font-mono">
            Price must be between $0.50 (₹40) and $50.00 (₹4,000).
          </p>
        )}

        {/* 85/15 Live Revenue Split Calculator */}
        <div className="mt-4 pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-700 uppercase mb-3">
            <Calculator className="w-3.5 h-3.5 text-cobalt-600" />
            <span>85 / 15 Live Revenue Split Breakdown</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Creator Share (85%) */}
            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-emerald-800 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Creator Payout Share (85%)</span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-950 mt-1">
                  ${creatorShareUsd.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-emerald-800">
                    (₹{creatorShareInr.toLocaleString("en-IN")})
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                85%
              </span>
            </div>

            {/* Network Protocol Fee (15%) */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  <span>Network Escrow &amp; Verify Fee (15%)</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-700 mt-1">
                  ${networkShareUsd.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    (₹{networkShareInr.toLocaleString("en-IN")})
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                15%
              </span>
            </div>
          </div>

          {/* Volume Projection */}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="py-1.5 px-3">Monthly Volume</th>
                  <th className="py-1.5 px-3">Gross Contract Spend</th>
                  <th className="py-1.5 px-3 text-right">Creator Net (85%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {[100, 1000, 5000].map((vol) => (
                  <tr key={vol} className="hover:bg-slate-50">
                    <td className="py-1.5 px-3 text-slate-700">{vol.toLocaleString()} tasks</td>
                    <td className="py-1.5 px-3 text-slate-600">
                      ${(vol * priceUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })} (₹
                      {(vol * priceInr).toLocaleString("en-IN")})
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-emerald-700">
                      ${(vol * creatorShareUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                      (₹{(vol * creatorShareInr).toLocaleString("en-IN")})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
