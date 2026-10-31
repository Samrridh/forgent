"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  ForgentUserSession,
  UserRole,
  createPersonaSession,
} from "@/lib/auth-session";

interface AuthContextType {
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

const defaultSession: ForgentUserSession = createPersonaSession("BUYER");

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<ForgentUserSession>(defaultSession);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

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
        setIsAuthModalOpen(false);
      }
    } catch {
      setSession(createPersonaSession(role));
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
  };

  return (
    <AuthContext.Provider
      value={{
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
