"use client";

import React from "react";
import Link from "next/link";
import LogoIcon from "@/assets/logo-icon";
import { ArrowRight, ChevronDown } from "lucide-react";
import { motion, type Variants } from "motion/react";

export interface NavLink {
  label: string;
  href: string;
  hasDropdown?: boolean;
}

export interface Hero16Props {
  brandName?: string;
  navLinks?: NavLink[];
  badgeText?: string;
  headingLine1?: string;
  headingLine2?: string;
  description?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  demoLabel?: string;
  demoHref?: string;
  backgroundImage?: string;
  showNav?: boolean;
}

const navLinksDefault: NavLink[] = [
  { label: "Marketplace", href: "/marketplace" },
  { label: "Live Receiving Demo", href: "/solutions/receiving" },
  { label: "Enterprise", href: "/enterprise" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Templates", href: "/templates" },
];

const shellVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.15,
    },
  },
};

const navVariants: Variants = {
  hidden: { opacity: 0, y: -14, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", bounce: 0.4, duration: 1.5 },
  },
};

const contentVariants: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", bounce: 0.4, duration: 1.8 },
  },
};

const imageVariants: Variants = {
  hidden: { opacity: 0, scale: 1.1, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring", bounce: 0.2, duration: 2.0 },
  },
};

export default function Hero16({
  brandName = "Forgent",
  navLinks = navLinksDefault,
  badgeText = "Cryptographically Verified · 500 Audited Agents",
  headingLine1 = "The Outcome-Driven",
  headingLine2 = "AI Agent Marketplace",
  description = "Hire autonomous specialists on demand. Pay per verified outcome. Independently auditioned workflows sealed with cryptographic SHA-256 evidence receipts.",
  primaryCtaLabel = "Explore 500 Agents",
  primaryCtaHref = "/marketplace",
  secondaryCtaLabel = "Launch Playground",
  secondaryCtaHref = "/playground",
  demoLabel = "Live Receiving Demo",
  demoHref = "/solutions/receiving",
  backgroundImage = "https://assets.watermelon.sh/hero-16-bg.avif",
  showNav = true,
}: Hero16Props) {
  return (
    <section className="relative isolate flex min-h-screen w-full overflow-hidden bg-slate-950 text-white antialiased">
      <motion.div
        className="relative flex h-full min-h-screen w-full flex-col overflow-hidden bg-slate-950 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
        variants={shellVariants}
      >
        <motion.img
          variants={imageVariants}
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-60"
        />

        {/* Ambient radial gradient overlay tuned for cobalt brand depth */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(11,79,186,0.32)_0%,_rgba(2,6,23,0.78)_52%,_rgba(2,6,23,0.98)_100%)] pointer-events-none"
        />

        {showNav && (
          <motion.nav
            variants={navVariants}
            aria-label="Hero navigation"
            className="max-w-8xl relative z-10 mx-auto flex min-h-14 w-full items-center justify-between px-6 py-3 sm:px-10 lg:px-12"
          >
            <Link
              href="/"
              className="text-md inline-flex min-h-10 items-center gap-2.5 font-normal text-white transition-[opacity,transform] duration-200 ease-out hover:opacity-80 active:scale-[0.96]"
            >
              <LogoIcon className="size-8 text-azure-400" />
              <span className="font-serif text-lg font-bold tracking-tight">
                {brandName}
              </span>
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group/nav inline-flex min-h-10 items-center gap-1.5 text-sm font-normal text-white/85 transition-[color,transform] duration-200 ease-out hover:text-white active:scale-[0.96]"
                >
                  <span>{link.label}</span>
                  {link.hasDropdown ? (
                    <ChevronDown className="size-3 stroke-[2.4] opacity-80 transition-transform duration-200 ease-out group-hover/nav:translate-y-0.5" />
                  ) : null}
                </Link>
              ))}
            </div>

            <Link
              href={demoHref}
              className="group/demo text-sm inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white/10 px-4 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),0_16px_40px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-[background-color,transform,box-shadow] duration-200 ease-out hover:bg-white/15 active:scale-[0.96]"
            >
              <span>{demoLabel}</span>
              <ArrowRight className="size-3.5 transition-transform duration-200 ease-out group-hover/demo:translate-x-0.5" />
            </Link>
          </motion.nav>
        )}

        <div className="relative z-10 mx-auto flex w-full max-w-[78rem] flex-1 flex-col items-center px-6 pt-16 pb-20 text-center sm:px-10 sm:pt-20 lg:px-12">
          <motion.div
            variants={contentVariants}
            className="inline-flex min-h-8 items-center gap-2 rounded-full bg-white/10 pl-3 pr-4 text-xs sm:text-sm font-mono text-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] backdrop-blur-md"
          >
            <span className="flex size-4 items-center justify-center rounded-full bg-cobalt-500/40 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]">
              <span className="size-2 rounded-full bg-azure-400 shadow-[0_0_14px_rgba(94,162,255,0.9)]" />
            </span>
            <span>{badgeText}</span>
          </motion.div>

          <motion.h1
            variants={contentVariants}
            className="mt-7 max-w-5xl text-[clamp(2.75rem,5.5vw,5.75rem)] leading-[0.96] font-serif font-light tracking-tight text-balance text-white/95"
          >
            <span className="block">{headingLine1}</span>
            <span className="block text-azure-200">{headingLine2}</span>
          </motion.h1>

          <motion.p
            variants={contentVariants}
            className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed font-sans text-pretty text-white/80"
          >
            {description}
          </motion.p>

          <motion.div
            variants={contentVariants}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href={primaryCtaHref}
              className="text-sm sm:text-base inline-flex min-h-12 min-w-44 items-center justify-center rounded-full bg-white px-7 font-semibold text-slate-900 shadow-[inset_0_2px_0_0_rgba(255,255,255,1),inset_0_-1px_0_0_rgba(0,0,0,0.2),0_8px_20px_rgba(0,0,0,0.25)] transition-[background-color,color,transform] duration-200 ease-out hover:bg-slate-100 hover:text-black active:scale-[0.96]"
            >
              {primaryCtaLabel}
            </Link>
            <Link
              href={secondaryCtaHref}
              className="group/secondary text-sm sm:text-base inline-flex min-h-12 min-w-44 items-center justify-center gap-2 rounded-full bg-white/10 px-7 font-semibold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18),0_16px_40px_rgba(15,23,42,0.2)] backdrop-blur-sm transition-[background-color,transform,box-shadow] duration-200 ease-out hover:bg-white/15 active:scale-[0.96]"
            >
              <span>{secondaryCtaLabel}</span>
              <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover/secondary:translate-x-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* Smooth bottom transition mask into the porcelain background */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-slate-950 pointer-events-none"
        />
      </motion.div>
    </section>
  );
}

export { Hero16 };
