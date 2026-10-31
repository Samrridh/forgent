"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/agents", label: "Explore agents" },
  { href: "/enterprise", label: "Enterprise" },
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Documentation" },
  { href: "/publish", label: "For builders" },
  { href: "/console", label: "API console" },
];

export function SharedNavigation({ hero = false, light = false }: { hero?: boolean; light?: boolean }) {
  const [open, setOpen] = useState(false);
  return <nav className={`shared-navigation ${hero ? "shared-navigation-hero" : ""} ${light ? "shared-navigation-light" : ""}`} aria-label="Main navigation">
    <Link className="shared-navigation-brand" href="/"><Image src="/firefly.svg" width={32} height={32} alt="" />forgent<span>.</span></Link>
    <div className="shared-navigation-links">{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}</div>
    <button className="shared-menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
    {open && <div className="shared-mobile-menu">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</Link>)}</div>}
  </nav>;
}
