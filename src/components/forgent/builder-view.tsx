"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Code2, Compass, LayoutDashboard, UploadCloud, UserRound } from "lucide-react";
import { PublishWizard } from "@/components/creator/publish-wizard/publish-wizard";
import { BuilderProfileForm } from "./builder-profile-form";
import { BuilderListings } from "./builder-listings";

type BuilderTab = "overview" | "upload" | "agents" | "profile";
const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "upload", label: "Submit an agent", icon: UploadCloud },
  { id: "agents", label: "Your agents", icon: Code2 },
  { id: "profile", label: "Builder profile", icon: UserRound },
] as const;

function tabFromUrl(): BuilderTab {
  const value = new URLSearchParams(window.location.search).get("tab");
  return tabs.some((tab) => tab.id === value) ? value as BuilderTab : "overview";
}

export function BuilderView() {
  const [tab, setTab] = useState<BuilderTab>("overview");
  useEffect(() => {
    const sync = () => setTab(tabFromUrl());
    sync(); window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  function showTab(next: BuilderTab) {
    const url = new URL(window.location.href);
    if (next === "overview") url.searchParams.delete("tab"); else url.searchParams.set("tab", next);
    window.history.pushState(null, "", url);
    setTab(next);
  }
  return <div id="submit" className="enterprise-dashboard builder-dashboard page-width">
    <aside className="enterprise-dashboard-sidebar" aria-label="Builder workspace navigation">
      <div className="enterprise-dashboard-brand"><span className="enterprise-dashboard-mark"><Code2 size={18}/></span><div><strong>Builder</strong><small>DEMO WORKSPACE</small></div></div>
      <span className="enterprise-dashboard-label">WORKSPACE</span><nav>{tabs.map(({ id, label, icon: Icon }) => <button id={`builder-tab-${id}`} key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => showTab(id)}><Icon size={17}/>{label}</button>)}</nav>
      <span className="enterprise-dashboard-label">QUICK LINKS</span><nav><Link href="/agents"><Compass size={17}/>Explore agents</Link></nav>
    </aside>
    <div className="enterprise-dashboard-main"><div className="enterprise-dashboard-top"><span>BUILDER / {tabs.find((item) => item.id === tab)?.label.toUpperCase()}</span><span>DEMO WORKSPACE</span></div>
      {tab === "overview" && <section className="enterprise-dashboard-overview"><div className="enterprise-dashboard-heading"><div><p className="business-kicker">YOUR WORKSPACE</p><h1>Build and share an agent.</h1><p>Describe your agent, review its package, and publish a listing for its hosted endpoint.</p></div><button className="business-primary" onClick={() => showTab("upload")}><UploadCloud size={16}/> Submit an agent</button></div>
        <div className="enterprise-dashboard-summary"><article><span>01 / SUBMIT</span><UploadCloud size={21}/><h2>Describe your agent</h2><p>Add its contract and request a static package review.</p><button onClick={() => showTab("upload")}>Submit an agent <ArrowRight size={15}/></button></article><article><span>02 / MANAGE</span><Code2 size={21}/><h2>See your listings</h2><p>Find the hosted agents published to the marketplace.</p><button onClick={() => showTab("agents")}>View your agents <ArrowRight size={15}/></button></article><article><span>03 / PROFILE</span><UserRound size={21}/><h2>Builder profile</h2><p>Preview how to introduce your work to customers.</p><button onClick={() => showTab("profile")}>View profile <ArrowRight size={15}/></button></article></div>
        <div className="enterprise-dashboard-note"><strong>About this workspace</strong><p>Package review is static: uploaded code and suggested tests are not run. Hosted agents use their builder-provided endpoint; demo checkout does not charge money.</p></div></section>}
      <div className="builder-dashboard-content" hidden={tab !== "upload"}><PublishWizard onCancel={() => showTab("overview")} onPublishAgent={() => {}} /></div>
      {tab === "agents" && <div className="builder-dashboard-content"><BuilderListings onSubmit={() => showTab("upload")} /></div>}
      <div className="builder-dashboard-content" hidden={tab !== "profile"}><BuilderProfileForm /></div>
    </div>
  </div>;
}
