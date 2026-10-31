"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "USD" | "INR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  toggleCurrency: () => void;
  exchangeRate: number; // 1 USD = 80 INR
  walletBalanceUsd: number;
  walletBalanceInr: number;
  formattedWalletBalance: string;
  topUpWallet: (amountUsd: number) => void;
  isTopUpOpen: boolean;
  setIsTopUpOpen: (open: boolean) => void;
  formatPrice: (usdAmount: number) => string;
}

const EXCHANGE_RATE = 80;
const DEFAULT_BALANCE_USD = 50.0;

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [walletBalanceUsd, setWalletBalanceUsd] = useState<number>(DEFAULT_BALANCE_USD);
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedCurrency = localStorage.getItem("forgent_currency");
      if (savedCurrency === "USD" || savedCurrency === "INR") {
        setCurrencyState(savedCurrency);
      }
      const savedBalance = localStorage.getItem("forgent_wallet_balance");
      if (savedBalance) {
        const parsed = parseFloat(savedBalance);
        if (!isNaN(parsed) && parsed >= 0) {
          setWalletBalanceUsd(parsed);
        }
      }
    } catch {
      // LocalStorage access may fail in restricted environments
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try {
      localStorage.setItem("forgent_currency", c);
    } catch {}
  };

  const toggleCurrency = () => {
    const next = currency === "USD" ? "INR" : "USD";
    setCurrency(next);
  };

  const topUpWallet = (amountUsd: number) => {
    setWalletBalanceUsd((prev) => {
      const next = prev + amountUsd;
      try {
        localStorage.setItem("forgent_wallet_balance", next.toString());
      } catch {}
      return next;
    });
  };

  const walletBalanceInr = Math.round(walletBalanceUsd * EXCHANGE_RATE);

  const formattedWalletBalance =
    currency === "USD"
      ? `$${walletBalanceUsd.toFixed(2)}`
      : `₹${walletBalanceInr.toLocaleString("en-IN")}`;

  const formatPrice = (usdAmount: number): string => {
    if (currency === "USD") {
      return `$${usdAmount.toFixed(2)}`;
    }
    const inr = Math.round(usdAmount * EXCHANGE_RATE);
    return `₹${inr.toLocaleString("en-IN")}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        exchangeRate: EXCHANGE_RATE,
        walletBalanceUsd,
        walletBalanceInr,
        formattedWalletBalance,
        topUpWallet,
        isTopUpOpen,
        setIsTopUpOpen,
        formatPrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
