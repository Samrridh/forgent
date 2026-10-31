"use client";
import { useState } from "react";
import { ArrowRight, Code2, FileCheck2, UploadCloud, UserRound } from "lucide-react";
import { ForgentHero2 } from "@/components/watermelon-ui/forgent-heroes";
import { HostedPackageForm } from "./hosted-package-form";
import { BuilderProfileForm } from "./builder-profile-form";
import { PreviewNote } from "./ui";

type BuilderTab = "upload" | "agents" | "profile";
const tabs: {id:BuilderTab;label:string;description:string;icon:typeof UploadCloud}[] = [
 {id:"upload",label:"Submit an agent",description:"Add a package",icon:UploadCloud},
 {id:"agents",label:"Your agents",description:"Evaluate and publish",icon:Code2},
 {id:"profile",label:"Builder profile",description:"Introduce yourself",icon:UserRound},
];
export function BuilderView(){
 const [tab,setTab]=useState<BuilderTab>("upload");
 function handleKeys(event:React.KeyboardEvent<HTMLButtonElement>,index:number){if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;setTab(tabs[next].id);document.getElementById(`builder-tab-${tabs[next].id}`)?.focus()}
 return <><ForgentHero2/><div className="page-width inner-page builder-page"><PreviewNote>Upload the sample support package to create a local draft. The runtime is built in; arbitrary code is not supported. Billing is simulated.</PreviewNote><div className="builder-steps"><div><span>01</span><UploadCloud size={20}/><h3>Share your agent</h3><p>Upload the sample manifest package; its runtime defines the interface.</p></div><div><span>02</span><FileCheck2 size={20}/><h3>Evaluate the service</h3><p>Run universal checks and task-specific cases before listing.</p></div><div><span>03</span><Code2 size={20}/><h3>Publish on Forgent</h3><p>Customers discover your service through one API.</p></div></div><section id="submit" className="builder-workspace"><div className="builder-workspace-heading"><div><span className="content-kicker">BUILDER WORKSPACE</span><h2>Everything in one place.</h2><p>Submit your agent, review its results, and create your profile.</p></div><a className="text-link" href="/samples/support-agent.zip" download>Download sample ZIP <ArrowRight size={15}/></a></div><div className="builder-tabs" role="tablist" aria-label="Builder workspace">{tabs.map((item,index)=>{const Icon=item.icon;return <button key={item.id} id={`builder-tab-${item.id}`} role="tab" aria-selected={tab===item.id} aria-controls={`builder-panel-${item.id}`} tabIndex={tab===item.id?0:-1} className={`builder-tab ${tab===item.id?"is-active":""}`} onClick={()=>setTab(item.id)} onKeyDown={event=>handleKeys(event,index)}><span className="builder-tab-icon"><Icon size={19}/></span><span><strong>{item.label}</strong><small>{item.description}</small></span></button>})}</div><div className="builder-tab-content"><HostedPackageForm activeTab={tab} onShowAgents={()=>setTab("agents")}/><div id="builder-panel-profile" role="tabpanel" aria-labelledby="builder-tab-profile" hidden={tab!=="profile"}><BuilderProfileForm/></div></div></section></div></>;
}
