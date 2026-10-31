"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Code2, Compass, FileCode2, LayoutDashboard, UploadCloud, UserRound, Wrench } from "lucide-react";
import { HostedPackageForm } from "./hosted-package-form";
import { BuilderProfileForm } from "./builder-profile-form";
import { PreviewNote } from "./ui";
import { CreatorStudio } from "@/components/creator/creator-studio";

type BuilderTab = "overview" | "upload" | "agents" | "profile" | "studio";
const tabs = [
 {id:"overview",label:"Overview",icon:LayoutDashboard},
 {id:"upload",label:"Submit an agent",icon:UploadCloud},
 {id:"agents",label:"Your agents",icon:Code2},
 {id:"profile",label:"Builder profile",icon:UserRound},
 {id:"studio",label:"Prototype tools",icon:Wrench},
] as const;
export function BuilderView(){
 const [tab,setTab]=useState<BuilderTab>("overview");
 return <div id="submit" className="enterprise-dashboard builder-dashboard page-width">
  <aside className="enterprise-dashboard-sidebar" aria-label="Builder workspace navigation">
   <div className="enterprise-dashboard-brand"><span className="enterprise-dashboard-mark"><Code2 size={18}/></span><div><strong>Builder</strong><small>DEMO WORKSPACE</small></div></div>
   <span className="enterprise-dashboard-label">WORKSPACE</span><nav>{tabs.map(({id,label,icon:Icon})=><button id={`builder-tab-${id}`} key={id} type="button" aria-current={tab===id?"page":undefined} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}</nav>
   <span className="enterprise-dashboard-label">QUICK LINKS</span><nav><Link href="/agents"><Compass size={17}/>Explore agents</Link><a href="/samples/support-agent.zip" download><FileCode2 size={17}/>Sample package</a></nav>
  </aside>
  <div className="enterprise-dashboard-main"><div className="enterprise-dashboard-top"><span>BUILDER / {tabs.find(item=>item.id===tab)?.label.toUpperCase()}</span><span>LOCAL DEMO</span></div>
   {tab==="overview"&&<section className="enterprise-dashboard-overview"><div className="enterprise-dashboard-heading"><div><p className="business-kicker">YOUR WORKSPACE</p><h1>Build and share an agent.</h1><p>Submit a support package, review its demo evaluation, and publish it to the local catalog.</p></div><button className="business-primary" onClick={()=>setTab("upload")}><UploadCloud size={16}/> Submit an agent</button></div>
    <div className="enterprise-dashboard-summary"><article><span>01 / SUBMIT</span><UploadCloud size={21}/><h2>Share a package</h2><p>Upload the sample manifest to create an agent draft.</p><button onClick={()=>setTab("upload")}>Submit an agent <ArrowRight size={15}/></button></article><article><span>02 / MANAGE</span><Code2 size={21}/><h2>Review your agents</h2><p>Run a simulated evaluation and publish an eligible draft.</p><button onClick={()=>setTab("agents")}>View your agents <ArrowRight size={15}/></button></article><article><span>03 / EXPLORE</span><Wrench size={21}/><h2>Prototype tools</h2><p>Explore static package review and illustrative builder analytics.</p><button onClick={()=>setTab("studio")}>Open tools <ArrowRight size={15}/></button></article></div>
    <div className="enterprise-dashboard-note"><strong>About this workspace</strong><p>The local demo accepts a manifest for the built-in support runtime. Arbitrary code is not executed, and billing is simulated.</p></div></section>}
   <div className="builder-dashboard-content" hidden={tab!=="upload"&&tab!=="agents"}><HostedPackageForm activeTab={tab==="agents"?"agents":"upload"} onShowAgents={()=>setTab("agents")}/></div>
   <div className="builder-dashboard-content" hidden={tab!=="profile"}><BuilderProfileForm/></div>
   {tab==="studio"&&<div className="builder-dashboard-content"><PreviewNote>Prototype tools use separate sample data. The wizard does not publish to the local catalog; payouts and analytics are simulated.</PreviewNote><CreatorStudio/></div>}
  </div>
 </div>;
}
