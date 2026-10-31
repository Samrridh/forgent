"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useAuth, type DemoPersona } from "@/context/auth-context";

const links = [
  { href: "/agents", label: "Explore agents" },
  { href: "/enterprise", label: "Enterprise" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Documentation" },
  { href: "/publish", label: "For builders" },
];

export function SharedNavigation({ hero = false, light = false }: { hero?: boolean; light?: boolean }) {
  const { demoPersona, setDemoPersona } = useAuth();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [switching, setSwitching] = useState(false);
  const dashboard = demoPersona === "builder" ? { href: "/builder/overview", label: "Builder dashboard" } : demoPersona === "business" ? { href: "/buyer/overview", label: "Business dashboard" } : null;
  async function switchPersona(persona: DemoPersona) {
    setSwitching(true); setError("");
    try { await setDemoPersona(persona); }
    catch { setError("Could not change workspace. Try again."); }
    finally { setSwitching(false); }
  }
  return <nav className={`shared-navigation ${hero ? "shared-navigation-hero" : ""} ${light ? "shared-navigation-light" : ""}`} aria-label="Main navigation">
    <Link className="shared-navigation-brand" href="/"><Image src="/firefly.svg" width={32} height={32} alt="" />forgent<span>.</span></Link>
    <div className="shared-navigation-links">{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}{dashboard && <Link href={dashboard.href}>{dashboard.label}</Link>}</div>
    <label className="shared-persona"><span className="sr-only">Choose workspace</span><select value={demoPersona} disabled={switching} onChange={(event) => void switchPersona(event.target.value as DemoPersona)}><option value="individual">Individual</option><option value="builder">Builder</option><option value="business">Business</option></select></label>
    <button className="shared-menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    {open && <div className="shared-mobile-menu">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}{dashboard && <Link href={dashboard.href} onClick={() => setOpen(false)}>{dashboard.label}</Link>}</div>}
    {error && <span className="shared-persona-error" role="alert">{error}</span>}
  </nav>;
}
