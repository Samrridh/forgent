"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "./top-nav";

export function Header() {
  const pathname = usePathname();

  // On the landing page (/), Hero-16 provides its own dark navigation bar and header
  if (pathname === "/") {
    return null;
  }

  return (
    <>
      {/* Demo Environment Notice Banner */}
      <aside
        role="status"
        aria-label="Demo environment notice"
        className="bg-slate-900 text-white px-4 py-1.5 text-xs text-center font-mono tracking-wide flex items-center justify-center gap-3"
      >
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-400 font-semibold tracking-wider">
          FORGENT VERIFIED DEMO
        </span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">500 AUDITED AGENTS</span>
        <span className="text-slate-500">•</span>
        <span className="text-slate-300">
          DUAL-CURRENCY SIMULATED SETTLEMENT
        </span>
      </aside>

      {/* Global Top Navigation with Organization Switcher */}
      <TopNav />
    </>
  );
}

export { TopNav };
