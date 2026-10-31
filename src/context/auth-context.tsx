"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  ForgentUserSession,
  UserRole,
  createPersonaSession,
} from "@/lib/auth-session";

interface AuthContextType {
  demoPersona: DemoPersona;
  setDemoPersona: (persona: DemoPersona) => Promise<void>;
  session: ForgentUserSession;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  loginWithPersona: (role: UserRole) => Promise<void>;
  loginWithMagicLink: (email: string, role?: UserRole) => Promise<void>;
  loginWithOAuth: (provider: "google" | "github") => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export type DemoPersona = "individual" | "builder" | "business";
export const DEMO_PERSONA_KEY = "forgent-demo-persona";
function readDemoPersona(): DemoPersona {
  try {
    const stored = window.localStorage.getItem(DEMO_PERSONA_KEY);
    return stored === "builder" || stored === "business" ? stored : "individual";
  } catch { return "individual"; }
}

const defaultSession: ForgentUserSession = createPersonaSession("BUYER");

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ForgentUserSession>(defaultSession);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [demoPersona, setPersona] = useState<DemoPersona>("individual");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const rememberPersona = (persona: DemoPersona) => {
    try { if (persona === "individual") window.localStorage.removeItem(DEMO_PERSONA_KEY); else window.localStorage.setItem(DEMO_PERSONA_KEY, persona); } catch { /* The selection remains active for this page. */ }
    setPersona(persona);
  };

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        }
      }
    } catch {
      // Local fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    setPersona(readDemoPersona());
    const sync = (event: StorageEvent) => { if (event.key === DEMO_PERSONA_KEY) { setPersona(readDemoPersona()); void fetchSession(); } };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [fetchSession]);

  const setDemoPersona = async (persona: DemoPersona) => {
    const response = await fetch("/api/auth/session", persona === "individual" ? { method: "DELETE" } : {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "switch_persona", role: persona === "builder" ? "CREATOR" : "BUYER" }),
    });
    if (!response.ok) throw new Error("Could not switch workspace.");
    if (persona === "individual") setSession(defaultSession);
    else { const data = await response.json(); setSession(data.session); }
    rememberPersona(persona);
  };

  const loginWithPersona = async (role: UserRole) => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch_persona", role }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        rememberPersona(role === "CREATOR" ? "builder" : "business");
        setIsAuthModalOpen(false);
      }
    } catch {
      setSession(createPersonaSession(role));
      rememberPersona(role === "CREATOR" ? "builder" : "business");
      setIsAuthModalOpen(false);
    }
  };

  const loginWithMagicLink = async (email: string, role: UserRole = "BUYER") => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "magic_link", email, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setIsAuthModalOpen(false);
      }
    } catch {
      setIsAuthModalOpen(false);
    }
  };

  const loginWithOAuth = async (provider: "google" | "github") => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "oauth", provider }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        setIsAuthModalOpen(false);
      }
    } catch {
      setIsAuthModalOpen(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "switch_org", organizationId: orgId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      }
    } catch {
      // Update locally if found
      const match = session.organizations.find((o) => o.id === orgId);
      if (match) {
        setSession((prev) => ({
          ...prev,
          activeOrganizationId: match.id,
          activeOrganizationName: match.name,
        }));
      }
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
    } catch {}
    setSession(defaultSession);
    rememberPersona("individual");
  };

  return (
    <AuthContext.Provider
      value={{
        demoPersona,
        setDemoPersona,
        session,
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        loginWithPersona,
        loginWithMagicLink,
        loginWithOAuth,
        switchOrganization,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
