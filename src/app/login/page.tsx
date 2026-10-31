"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { UserRole } from "@/lib/auth-session";
import {
  Layers,
  Sparkles,
  Building2,
  Mail,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Lock,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { session, loginWithPersona, loginWithMagicLink, loginWithOAuth } = useAuth();

  const [activeTab, setActiveTab] = useState<"personas" | "magic-link" | "oauth">("personas");
  const [email, setEmail] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("BUYER");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePersonaSelect = async (role: UserRole) => {
    setIsSubmitting(true);
    setStatusMessage(null);
    await loginWithPersona(role);
    setIsSubmitting(false);
    setStatusMessage(`Switched to ${role} persona. Redirecting...`);
    setTimeout(() => {
      if (role === "CREATOR") {
        router.push("/builder/overview");
      } else if (role === "ENTERPRISE_ADMIN") {
        router.push("/buyer/overview");
      } else {
        router.push("/marketplace");
      }
    }, 600);
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;

    setIsSubmitting(true);
    await loginWithMagicLink(email, selectedRole);
    setIsSubmitting(false);
    setStatusMessage(`Magic link verified. Issued forgent_session for ${email}.`);
    setTimeout(() => router.push("/marketplace"), 800);
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setIsSubmitting(true);
    await loginWithOAuth(provider);
    setIsSubmitting(false);
    setStatusMessage(`Authenticated via ${provider}. Redirecting...`);
    setTimeout(() => router.push("/marketplace"), 600);
  };

  return (
    <div className="min-h-screen bg-porcelain-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <span className="w-10 h-10 rounded-xl bg-cobalt-500 text-white flex items-center justify-center font-serif text-2xl font-bold tracking-tight shadow-sm group-hover:bg-cobalt-600 transition-colors">
            F
          </span>
          <span className="font-serif text-3xl font-bold tracking-tight text-slate-900">
            FORGENT
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Multi-Tenant Workspace Sign In
        </h2>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Cryptographically signed session credentials with organization scope and role authorization
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white border border-slate-200 py-8 px-6 sm:px-10 rounded-2xl shadow-xl space-y-6">
          {/* Active Session Indicator */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">Current Session: </span>
              <span className="font-bold text-slate-900">{session.name}</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cobalt-50 text-cobalt-700 border border-cobalt-200">
              {session.role}
            </span>
          </div>

          {statusMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Nav Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
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
              SSO Providers
            </button>
          </div>

          {/* TAB 1: DEMO PERSONAS */}
          {activeTab === "personas" && (
            <div className="space-y-3">
              <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Instant 1-Click Role Switch
              </div>

              {/* Buyer */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePersonaSelect("BUYER")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  session.role === "BUYER"
                    ? "border-cobalt-500 bg-cobalt-50/40 ring-1 ring-cobalt-500 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      Sarah Chen
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-200">
                      BUYER
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Enterprise Operations Lead • Northstar Logistics
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Workspace: Northstar Logistics Enterprise
                  </div>
                </div>
              </button>

              {/* Creator */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePersonaSelect("CREATOR")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  session.role === "CREATOR"
                    ? "border-cobalt-500 bg-cobalt-50/40 ring-1 ring-cobalt-500 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      Alex Rivera
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200">
                      CREATOR
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Lead Agent Engineer • Autonomous FinTech Studio
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Workspace: Autonomous FinTech Studio
                  </div>
                </div>
              </button>

              {/* Enterprise Admin */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handlePersonaSelect("ENTERPRISE_ADMIN")}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-4 ${
                  session.role === "ENTERPRISE_ADMIN"
                    ? "border-cobalt-500 bg-cobalt-50/40 ring-1 ring-cobalt-500 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">
                      Marcus Vance
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ENTERPRISE_ADMIN
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    VP Engineering & Infrastructure • Apex Capital LLC
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-1">
                    Workspace: Apex Capital LLC & Cross-Org Audits
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* TAB 2: MAGIC LINK */}
          {activeTab === "magic-link" && (
            <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Corporate Email
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
                    className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-cobalt-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Role Authorization Claim
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["BUYER", "CREATOR", "ENTERPRISE_ADMIN"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      className={`py-2 px-2 text-[10px] font-mono font-bold rounded-lg border text-center transition-all ${
                        selectedRole === r
                          ? "bg-cobalt-500 text-white border-cobalt-500"
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
                    <span>Signing Session Token...</span>
                  </>
                ) : (
                  <>
                    <span>Send Magic Link</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: OAUTH PROVIDERS */}
          {activeTab === "oauth" && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleOAuth("google")}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-3 transition-colors shadow-xs"
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
                onClick={() => handleOAuth("github")}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center justify-center gap-3 transition-colors shadow-xs"
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
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-cobalt-600" />
              <span>Cookie: forgent_session (HMAC-SHA256)</span>
            </span>
            <span className="text-slate-400">7-Day Retention</span>
          </div>
        </div>
      </div>
    </div>
  );
}
