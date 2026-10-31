"use client";

import React, { useState, useEffect } from "react";
import { useCurrency } from "@/context/currency-context";
import { UpiQrCode } from "./upi-qr-code";
import {
  X,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  ArrowUpRight,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

type GatewayTab = "stripe" | "razorpay";

interface CheckoutSuccessData {
  transactionId: string;
  referenceId: string;
  gateway: "stripe" | "razorpay";
  currency: "USD" | "INR";
  amountCreditedUsd: number;
  amountCreditedInr: number;
  newBalanceUsd: number;
  newBalanceInr: number;
}

export function WalletTopUpModal() {
  const {
    currency,
    isTopUpOpen,
    setIsTopUpOpen,
    walletBalanceUsd,
    walletBalanceInr,
    topUpWallet,
    exchangeRate,
    setCurrency,
  } = useCurrency();

  const [activeTab, setActiveTab] = useState<GatewayTab>("stripe");

  // USD state
  const [selectedUsd, setSelectedUsd] = useState<number>(50);
  const [customUsd, setCustomUsd] = useState<string>("");
  const [cardNumber, setCardNumber] = useState<string>("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState<string>("12/28");
  const [cardCvc, setCardCvc] = useState<string>("842");
  const [cardholderName, setCardholderName] = useState<string>("Alex Morgan");
  const [postalCode, setPostalCode] = useState<string>("94103");

  // INR state
  const [selectedInr, setSelectedInr] = useState<number>(4000);
  const [customInr, setCustomInr] = useState<string>("");
  const [vpa, setVpa] = useState<string>("user@okhdfcbank");
  const [isCopiedVpa, setIsCopiedVpa] = useState<boolean>(false);

  // Submission & Confirmation state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<CheckoutSuccessData | null>(null);

  // Sync tab with active global currency preference
  useEffect(() => {
    if (isTopUpOpen) {
      if (currency === "INR") {
        setActiveTab("razorpay");
      } else {
        setActiveTab("stripe");
      }
    }
  }, [isTopUpOpen, currency]);

  if (!isTopUpOpen) return null;

  const usdPresets = [25, 50, 100, 250];
  const inrPresets = [2000, 4000, 8000, 20000];

  const handleTabChange = (tab: GatewayTab) => {
    setActiveTab(tab);
    setErrorMessage(null);
    if (tab === "stripe") {
      setCurrency("USD");
    } else {
      setCurrency("INR");
    }
  };

  const handleClose = () => {
    setIsTopUpOpen(false);
    setSuccessData(null);
    setErrorMessage(null);
    setCustomUsd("");
    setCustomInr("");
  };

  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText("forgent@okhdfcbank");
      setIsCopiedVpa(true);
      setTimeout(() => setIsCopiedVpa(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  const fillStripeTestCard = () => {
    setCardNumber("4242 4242 4242 4242");
    setCardExpiry("12/28");
    setCardCvc("842");
    setCardholderName("Alex Morgan");
    setPostalCode("94103");
  };

  const handleStripeCheckout = async () => {
    const usdAmount = customUsd ? parseFloat(customUsd) : selectedUsd;
    if (isNaN(usdAmount) || usdAmount <= 0) {
      setErrorMessage("Please enter a valid USD top-up amount.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const amountCents = Math.round(usdAmount * 100);
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "stripe",
          amount: amountCents,
          currency: "USD",
          paymentMethodDetails: {
            cardNumber,
            cardholderName,
            postalCode,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Payment checkout failed");
      }

      const data = await res.json();
      topUpWallet(usdAmount);

      setSuccessData({
        transactionId: data.transactionId,
        referenceId: data.referenceId,
        gateway: "stripe",
        currency: "USD",
        amountCreditedUsd: usdAmount,
        amountCreditedInr: Math.round(usdAmount * exchangeRate),
        newBalanceUsd: data.newBalance?.usd ?? walletBalanceUsd + usdAmount,
        newBalanceInr:
          data.newBalance?.inr ??
          Math.round((walletBalanceUsd + usdAmount) * exchangeRate),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment execution failed";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRazorpayCheckout = async () => {
    const inrAmount = customInr ? parseFloat(customInr) : selectedInr;
    if (isNaN(inrAmount) || inrAmount <= 0) {
      setErrorMessage("Please enter a valid INR top-up amount.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const amountPaise = Math.round(inrAmount * 100);
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway: "razorpay",
          amount: amountPaise,
          currency: "INR",
          paymentMethodDetails: {
            vpa,
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "UPI payment confirmation failed");
      }

      const data = await res.json();
      const usdEquivalent = inrAmount / exchangeRate;
      topUpWallet(usdEquivalent);

      setSuccessData({
        transactionId: data.transactionId,
        referenceId: data.referenceId,
        gateway: "razorpay",
        currency: "INR",
        amountCreditedUsd: Number(usdEquivalent.toFixed(2)),
        amountCreditedInr: inrAmount,
        newBalanceUsd: data.newBalance?.usd ?? walletBalanceUsd + usdEquivalent,
        newBalanceInr:
          data.newBalance?.inr ??
          Math.round((walletBalanceUsd + usdEquivalent) * exchangeRate),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "UPI verification failed";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentUsdAmount = customUsd ? parseFloat(customUsd) || 0 : selectedUsd;
  const currentInrAmount = customInr ? parseFloat(customInr) || 0 : selectedInr;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-topup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-900">
        <button
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!successData ? (
          <div>
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cobalt-50 border border-cobalt-100 flex items-center justify-center text-cobalt-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3
                  id="wallet-topup-title"
                  className="text-lg font-semibold text-slate-900 tracking-tight"
                >
                  Dual-Rail Task Wallet Top-Up
                </h3>
                <p className="text-xs text-slate-500">
                  Instant escrow settlement via Stripe Card (USD) or Razorpay UPI (INR)
                </p>
              </div>
            </div>

            {/* Current Balance & Rate Callout */}
            <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-3.5 mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                  Current Task Wallet Balance
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  ${walletBalanceUsd.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    (₹{walletBalanceInr.toLocaleString("en-IN")})
                  </span>
                </div>
              </div>
              <div className="text-right text-xs font-mono text-slate-500">
                <div className="text-slate-400">Pegged Rate:</div>
                <div className="text-slate-800 font-semibold">1 USD = {exchangeRate} INR</div>
              </div>
            </div>

            {/* Dual Gateway Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => handleTabChange("stripe")}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "stripe"
                    ? "bg-white text-cobalt-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CreditCard className="w-4 h-4 text-cobalt-600" />
                <span>Stripe Card (USD)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("razorpay")}
                className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "razorpay"
                    ? "bg-white text-cobalt-900 shadow-sm border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <QrCode className="w-4 h-4 text-cobalt-600" />
                <span>Razorpay UPI (INR)</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
                {errorMessage}
              </div>
            )}

            {/* STRIPE CARD (USD) TAB */}
            {activeTab === "stripe" && (
              <div className="space-y-4">
                {/* Presets */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Select Amount (USD)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {usdPresets.map((usd) => {
                      const isSelected = selectedUsd === usd && !customUsd;
                      return (
                        <button
                          key={usd}
                          type="button"
                          onClick={() => {
                            setSelectedUsd(usd);
                            setCustomUsd("");
                          }}
                          className={`py-2 px-2 text-center font-mono text-xs font-bold rounded-lg border transition-all ${
                            isSelected
                              ? "bg-cobalt-500 text-white border-cobalt-500 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          ${usd}
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      placeholder="Custom USD amount (e.g. 75)"
                      value={customUsd}
                      onChange={(e) => {
                        setCustomUsd(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) setSelectedUsd(val);
                      }}
                      min="1"
                      className="w-full pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-mono"
                    />
                  </div>
                </div>

                {/* Card Fields */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-700">
                      Card Details
                    </label>
                    <button
                      type="button"
                      onClick={fillStripeTestCard}
                      className="text-[11px] font-mono text-cobalt-600 hover:text-cobalt-800 underline"
                    >
                      Use Test Card (4242...)
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                    />
                    <input
                      type="text"
                      placeholder="CVC"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                    />
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cobalt-600 shrink-0" />
                  <span>
                    Stripe Test Simulation: Process ${currentUsdAmount.toFixed(2)} USD (
                    {Math.round(currentUsdAmount * 100)} cents).
                  </span>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleStripeCheckout}
                    className="px-5 py-2 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing Stripe...</span>
                      </>
                    ) : (
                      <>
                        <span>Simulate Stripe Payment (${currentUsdAmount.toFixed(2)})</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* RAZORPAY UPI (INR) TAB */}
            {activeTab === "razorpay" && (
              <div className="space-y-4">
                {/* Presets */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Select Amount (INR)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {inrPresets.map((inr) => {
                      const isSelected = selectedInr === inr && !customInr;
                      return (
                        <button
                          key={inr}
                          type="button"
                          onClick={() => {
                            setSelectedInr(inr);
                            setCustomInr("");
                          }}
                          className={`py-2 px-1 text-center font-mono text-xs font-bold rounded-lg border transition-all ${
                            isSelected
                              ? "bg-cobalt-500 text-white border-cobalt-500 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          ₹{inr.toLocaleString("en-IN")}
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="Custom INR amount (e.g. 5000)"
                      value={customInr}
                      onChange={(e) => {
                        setCustomInr(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) setSelectedInr(val);
                      }}
                      min="100"
                      className="w-full pl-8 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-mono"
                    />
                  </div>
                </div>

                {/* Live SVG UPI QR Code & VPA Section */}
                <div className="p-4 bg-porcelain-100 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
                  <div className="shrink-0">
                    <UpiQrCode
                      vpa="forgent@okhdfcbank"
                      payeeName="Forgent Technologies"
                      amountInr={currentInrAmount}
                      size={140}
                    />
                  </div>
                  <div className="space-y-2 flex-1 min-w-0 text-left">
                    <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold">
                      Scan or Enter UPI VPA
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 select-all">
                        forgent@okhdfcbank
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyVpa}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded border border-slate-200 bg-white"
                        title="Copy VPA"
                      >
                        {isCopiedVpa ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Payer UPI Address (VPA)
                      </label>
                      <input
                        type="text"
                        value={vpa}
                        onChange={(e) => setVpa(e.target.value)}
                        placeholder="user@okhdfcbank"
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded font-mono bg-white focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Razorpay UPI Rail: Instant confirmation for ₹{currentInrAmount.toLocaleString("en-IN")} (
                    {Math.round(currentInrAmount * 100).toLocaleString()} paise).
                  </span>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleRazorpayCheckout}
                    className="px-5 py-2 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying UPI...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          Confirm UPI Payment (₹{currentInrAmount.toLocaleString("en-IN")})
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SUCCESS CONFIRMATION STATE */
          <div className="py-4 text-center">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Payment Confirmed & Wallet Credited
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {successData.gateway === "stripe"
                ? "Stripe credit card simulation settled to Task Wallet"
                : "Razorpay UPI transaction confirmed via NPCI rails"}
            </p>

            <div className="bg-porcelain-100 border border-slate-200 rounded-xl p-4 text-left font-mono text-xs mb-5 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Gateway Rail:</span>
                <span className="font-semibold text-slate-900 uppercase">
                  {successData.gateway}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Credited Amount:</span>
                <span className="font-semibold text-emerald-700">
                  +${successData.amountCreditedUsd.toFixed(2)} USD / +₹
                  {successData.amountCreditedInr.toLocaleString("en-IN")} INR
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Updated Task Wallet:</span>
                <span className="font-bold text-slate-900">
                  ${successData.newBalanceUsd.toFixed(2)} (₹
                  {successData.newBalanceInr.toLocaleString("en-IN")})
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-400 text-[10px]">
                <span>Gateway Ref:</span>
                <span className="truncate max-w-[220px] font-semibold text-slate-700">
                  {successData.referenceId}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
