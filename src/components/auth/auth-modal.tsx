"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/lib/auth-session";
import {
  X,
  Mail,
  Shield,
  Building2,
  Sparkles,
  Layers,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    session,
    loginWithPersona,
    loginWithMagicLink,
    loginWithOAuth,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"personas" | "magic-link" | "oauth">("personas");
  const [email, setEmail] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("BUYER");
  const [magicLinkSent, setMagicLinkSent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setIsAuthModalOpen(false);
    setMagicLinkSent(false);
    setEmail("");
  };

  const handlePersonaSelect = async (role: UserRole) => {
    setIsSubmitting(true);
    await loginWithPersona(role);
    setIsSubmitting(false);
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);
    await loginWithMagicLink(email, selectedRole);
    setMagicLinkSent(true);
    setIsSubmitting(false);
  };

  const handleOAuthLogin = async (provider: "google" | "github") => {
    setIsSubmitting(true);
    await loginWithOAuth(provider);
    setIsSubmitting(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cobalt-50 border border-cobalt-100 flex items-center justify-center text-cobalt-600 font-serif font-bold text-lg">
            F
          </div>
          <div>
            <h3
              id="auth-modal-title"
              className="text-lg font-semibold text-slate-900 tracking-tight"
            >
              Sign In to Forgent
            </h3>
            <p className="text-xs text-slate-500">
              Multi-tenant authentication with signed session tokens & enterprise workspace scoping
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("personas")}
            className={`py-2 rounded-lg transition-all ${
              activeTab === "personas"
                ? "bg-white text-cobalt-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Demo Personas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("magic-link")}
            className={`py-2 rounded-lg transition-all ${
              activeTab === "magic-link"
                ? "bg-white text-cobalt-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("oauth")}
            className={`py-2 rounded-lg transition-all ${
              activeTab === "oauth"
                ? "bg-white text-cobalt-900 shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            OAuth Providers
          </button>
        </div>

        {/* TAB 1: 1-CLICK DEMO PERSONAS */}
        {activeTab === "personas" && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              Select Demo Persona
            </div>

            {/* Persona: Buyer */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePersonaSelect("BUYER")}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                session.role === "BUYER"
                  ? "border-cobalt-500 bg-cobalt-50/40 ring-1 ring-cobalt-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Sarah Chen
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                    BUYER
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Enterprise Operations Lead • Northstar Logistics
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Scope: Northstar Logistics Enterprise
                </div>
              </div>
            </button>

            {/* Persona: Creator */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePersonaSelect("CREATOR")}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                session.role === "CREATOR"
                  ? "border-cobalt-500 bg-cobalt-50/40 ring-1 ring-cobalt-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Alex Rivera
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                    CREATOR
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Lead Agent Engineer • Autonomous FinTech Studio
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Scope: Autonomous FinTech Studio
                </div>
              </div>
            </button>

            {/* Persona: Enterprise Admin */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handlePersonaSelect("ENTERPRISE_ADMIN")}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                session.role === "ENTERPRISE_ADMIN"
                  ? "border-cobalt-500 bg-cobalt-50/40 ring-1 ring-cobalt-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Marcus Vance
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ENTERPRISE_ADMIN
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  VP Engineering & Infrastructure • Apex Capital LLC
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">
                  Scope: Apex Capital LLC & Cross-Org Audit
                </div>
              </div>
            </button>
          </div>
        )}

        {/* TAB 2: MAGIC LINK */}
        {activeTab === "magic-link" && (
          <div>
            {!magicLinkSent ? (
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cobalt-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Requested Role Claim
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["BUYER", "CREATOR", "ENTERPRISE_ADMIN"] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSelectedRole(r)}
                        className={`py-2 px-2 text-[10px] font-mono font-bold rounded-lg border text-center transition-all ${
                          selectedRole === r
                            ? "bg-cobalt-500 text-white border-cobalt-500 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Magic Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Magic Link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="py-4 text-center">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  Magic Link Simulation Authenticated
                </h4>
                <p className="text-xs text-slate-500 mb-4">
                  Signed token issued for <span className="font-mono font-bold text-slate-800">{email}</span> with claim <span className="font-mono text-cobalt-700 font-bold">{selectedRole}</span>.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-cobalt-500 hover:bg-cobalt-600 rounded-lg transition-colors"
                >
                  Continue to Workspace
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OAUTH PROVIDERS */}
        {activeTab === "oauth" && (
          <div className="space-y-3">
            <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              Single Sign-On Authentication
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOAuthLogin("google")}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center justify-center gap-3 transition-colors shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleOAuthLogin("github")}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium flex items-center justify-center gap-3 transition-colors shadow-xs"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>Continue with GitHub</span>
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cobalt-600 shrink-0" />
              <span>
                SSO claims automatically provision signed session credentials and multi-tenant org routing.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
