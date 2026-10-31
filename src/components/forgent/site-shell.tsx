import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function Mark() {
  return <Image width={32} height={32} className="brand-mark" src="/firefly.svg" alt="" aria-hidden="true" />;
}
export function SiteHeader() {
  return <header className="site-header"><div className="nav-inner"><Link className="wordmark" href="/"><Mark /><span>forgent<span className="wordmark-dot">.</span></span></Link><nav aria-label="Main navigation" className="main-nav"><Link href="/agents">Explore agents</Link><Link href="/enterprise">Enterprise</Link><Link href="/pricing">Pricing</Link><Link href="/docs">Documentation</Link><Link href="/publish">For builders</Link></nav><div className="nav-actions"><Link href="/login" className="nav-console">Demo sign in <ArrowUpRight size={14}/></Link><Link href="/agents" className="button button-dark nav-cta">Explore agents <ArrowUpRight size={14}/></Link></div></div></header>;
}
// Adapted from Watermelon UI Footer 1 (MIT): https://ui.watermelon.sh/block/footer-1
interface FooterLink { label: string; href: string }
interface FooterLinkGroup { title: string; links: FooterLink[] }
const linkGroups: FooterLinkGroup[] = [{ title: "Explore", links: [
  { label: "Explore agents", href: "/agents" }, { label: "Enterprise", href: "/enterprise" }, { label: "Pricing", href: "/pricing" }, { label: "Documentation", href: "/docs" },
  { label: "For builders", href: "/publish" }, { label: "Console", href: "/console" },
] }];
export function SiteFooter() {
  return <footer className="site-footer"><div className="footer-inner"><div><Link className="wordmark footer-wordmark" href="/"><Mark /><span>forgent<span className="wordmark-dot">.</span></span></Link><p>The agent layer for your application.</p></div><div className="footer-links">{linkGroups.map(group => group.links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>))}</div></div><div className="footer-bottom"><span>Built for the next wave of software.</span><span>Forgent / Hackathon preview</span></div></footer>;
}
