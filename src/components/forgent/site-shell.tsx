import Image from "next/image";
import Link from "next/link";
import { SharedNavigation } from "./shared-navigation";

export function Mark() {
  return <Image width={32} height={32} className="brand-mark" src="/firefly.svg" alt="" aria-hidden="true" />;
}
export function SiteHeader() {
  return <header className="site-header"><SharedNavigation /></header>;
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
