"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrency } from "@/context/currency-context";
import { useAuth } from "@/context/auth-context";
import {
  ChevronDown,
  Building2,
  User,
  Wallet,
  Plus,
  ArrowRight,
  Check,
  Shield,
  Layers,
  Sparkles,
  LogOut,
} from "lucide-react";

export function TopNav() {
  const pathname = usePathname();
  const {
    currency,
    setCurrency,
    walletBalanceUsd,
    walletBalanceInr,
    setIsTopUpOpen,
  } = useCurrency();

  const {
    session,
    switchOrganization,
    setIsAuthModalOpen,
    loginWithPersona,
    logout,
  } = useAuth();

  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const orgRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (orgRef.current && !orgRef.current.contains(event.target as Node)) {
        setIsOrgDropdownOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const organizations = session.organizations || [
    {
      id: "org_personal",
      name: "Personal Workspace",
      role: "OWNER",
      tier: "PERSONAL" as const,
    },
    {
      id: "org_northstar_logistics",
      name: "Northstar Logistics Enterprise",
      role: "ADMIN",
      tier: "ENTERPRISE" as const,
    },
    {
      id: "org_apex_capital",
      name: "Apex Capital LLC",
      role: "MEMBER",
      tier: "ENTERPRISE" as const,
    },
  ];

  const activeOrg =
    organizations.find((o) => o.id === session.activeOrganizationId) ||
    organizations[0];

  const isEnterpriseActive = activeOrg.tier === "ENTERPRISE";

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Mark & Multi-Tenant Organization Switcher */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="w-8 h-8 rounded-lg bg-cobalt-500 text-white flex items-center justify-center font-serif text-xl font-bold tracking-tight shadow-sm group-hover:bg-cobalt-600 transition-colors">
              F
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold tracking-tight text-slate-900 leading-none">
                FORGENT
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-0.5">
                Verified Agents
              </span>
            </div>
          </Link>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Organization Switcher Dropdown */}
          <div className="relative" ref={orgRef}>
            <button
              type="button"
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-porcelain-100 hover:bg-slate-100 text-slate-800 text-xs font-medium transition-colors"
              aria-expanded={isOrgDropdownOpen}
              aria-haspopup="true"
              aria-label="Switch workspace organization"
            >
              {isEnterpriseActive ? (
                <Building2 className="w-3.5 h-3.5 text-cobalt-600 shrink-0" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              )}
              <span className="font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-[200px]">
                {activeOrg.name}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider hidden md:inline-block ${
                  isEnterpriseActive
                    ? "bg-cobalt-50 text-cobalt-700 border border-cobalt-200"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {activeOrg.tier}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isOrgDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isOrgDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
                <div className="px-3.5 py-2 text-[11px] font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between border-b border-slate-100">
                  <span>Switch Workspace</span>
                  <span className="text-[10px] text-cobalt-600 font-bold">
                    {session.role}
                  </span>
                </div>

                <div className="p-1 space-y-0.5">
                  {organizations.map((org) => {
                    const isSelected = org.id === activeOrg.id;
                    const isOrgEnterprise = org.tier === "ENTERPRISE";

                    return (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => {
                          switchOrganization(org.id);
                          setIsOrgDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-xs transition-colors ${
                          isSelected
                            ? "bg-cobalt-50 text-cobalt-900 font-semibold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isOrgEnterprise
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isOrgEnterprise ? (
                              <Building2 className="w-3.5 h-3.5" />
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="truncate font-medium">{org.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Role: {org.role} • {org.tier}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-4 h-4 text-cobalt-600 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-1 border-t border-slate-100 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold text-cobalt-700 hover:bg-cobalt-50 transition-colors"
                  >
                    <span>Manage Workspaces & Personas</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/marketplace"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === "/marketplace"
                ? "bg-slate-100 text-cobalt-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Marketplace
          </Link>
          <Link
            href="/leaderboard"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === "/leaderboard"
                ? "bg-slate-100 text-cobalt-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Leaderboard
          </Link>
          <Link
            href="/templates"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === "/templates"
                ? "bg-slate-100 text-cobalt-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Templates
          </Link>
          <Link
            href="/playground"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === "/playground"
                ? "bg-slate-100 text-cobalt-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Playground
          </Link>
          <Link
            href="/buyer/overview"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname.startsWith("/buyer") || pathname.startsWith("/enterprise")
                ? "bg-slate-100 text-cobalt-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Enterprise Hub
          </Link>
          <Link
            href="/solutions/receiving"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname.startsWith("/solutions/receiving")
                ? "bg-slate-100 text-cobalt-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Receiving Wedge
          </Link>
          <Link
            href="/builder/overview"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname.startsWith("/builder")
                ? "bg-slate-100 text-cobalt-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Creator Studio
          </Link>
          <Link
            href="/verify"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname === "/verify"
                ? "bg-slate-100 text-cobalt-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Verify
          </Link>
          <Link
            href="/disputes"
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              pathname.startsWith("/disputes")
                ? "bg-slate-100 text-cobalt-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Disputes
          </Link>
        </nav>

        {/* Right: Currency, Wallet, Persona Switcher & Post Job */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Dual-Currency Switcher */}
          <div className="relative" ref={currencyRef}>
            <button
              type="button"
              onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-mono font-medium text-slate-700 transition-colors"
              aria-label="Switch currency"
            >
              <span className="font-semibold text-cobalt-600">
                {currency === "USD" ? "$" : "₹"}
              </span>
              <span>{currency}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isCurrencyDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                <button
                  type="button"
                  onClick={() => {
                    setCurrency("USD");
                    setIsCurrencyDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono transition-colors ${
                    currency === "USD"
                      ? "bg-cobalt-50 text-cobalt-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span>USD ($)</span>
                  <span className="text-slate-400 text-[10px]">US Dollar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency("INR");
                    setIsCurrencyDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono transition-colors ${
                    currency === "INR"
                      ? "bg-cobalt-50 text-cobalt-900 font-bold"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span>INR (₹)</span>
                  <span className="text-slate-400 text-[10px]">Indian Rupee</span>
                </button>
              </div>
            )}
          </div>

          {/* Task Wallet Balance Badge with 1-Click Dual Top-Up */}
          <button
            type="button"
            onClick={() => setIsTopUpOpen(true)}
            className="flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-lg border border-cobalt-200 bg-cobalt-50/60 hover:bg-cobalt-100/80 text-cobalt-900 text-xs font-mono transition-colors group shadow-xs"
            title="Click for instant dual-rail wallet top-up"
          >
            <Wallet className="w-3.5 h-3.5 text-cobalt-600" />
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-slate-900">
                {currency === "USD"
                  ? `$${walletBalanceUsd.toFixed(2)}`
                  : `₹${walletBalanceInr.toLocaleString("en-IN")}`}
              </span>
            </div>
            <div className="w-4 h-4 rounded bg-cobalt-500 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </button>

          {/* User Persona & Auth Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              aria-label="User account and persona settings"
            >
              <div className="w-6 h-6 rounded-md bg-cobalt-100 text-cobalt-800 flex items-center justify-center font-bold text-[11px] font-mono">
                {session.name.charAt(0)}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <div className="text-xs font-bold text-slate-900">{session.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">
                    {session.email}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-200">
                      {session.role}
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400">
                  Fast Persona Switch
                </div>

                <button
                  type="button"
                  onClick={() => {
                    loginWithPersona("BUYER");
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sarah Chen (Buyer)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loginWithPersona("CREATOR");
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Alex Rivera (Creator)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    loginWithPersona("ENTERPRISE_ADMIN");
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full px-3.5 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Marcus Vance (Admin)</span>
                </button>

                <div className="pt-1.5 border-t border-slate-100 mt-1">
                  <Link
                    href="/login"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-3.5 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                    <span>Auth Settings & SSO</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3.5 py-1.5 text-left text-xs hover:bg-red-50 text-red-700 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Post Job / Deploy Agent CTA */}
          <Link
            href="/jobs/new"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cobalt-500 hover:bg-cobalt-600 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Post Job</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
