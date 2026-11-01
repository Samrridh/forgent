"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChartNoAxesCombined } from "lucide-react";
import { DemoProgress } from "./demo-progress";

const accounts = [
 {name:"Northstar Retail",previous:48000,current:31000},
 {name:"Harbor Stores",previous:32000,current:24000},
 {name:"Cedar Market",previous:20000,current:21000},
];
const steps=["Prepare the question", "Review sample orders", "Compare account trends", "Prepare follow-up"];
export function IometeAgentDemo(){
 const [stage,setStage]=useState(0);const [running,setRunning]=useState(false);const [complete,setComplete]=useState(false);
 useEffect(()=>{if(!running)return;if(stage>=steps.length){setRunning(false);setComplete(true);return}const timer=window.setTimeout(()=>setStage(value=>value+1),600);return()=>window.clearTimeout(timer)},[running,stage]);
 function run(){setStage(0);setComplete(false);setRunning(true)}
 return <div className="page-width inner-page"><Link className="back-link" href="/agents"><ArrowLeft size={15}/> All agents</Link><div className="detail-heading"><div><div className="detail-kicker">SALES / IOMETE CONCEPT</div><h1>Account Insights</h1><p>See which customer accounts may need a follow-up.</p></div></div><div className="preview-note">Simulated agent · fictional data · no IOMETE connection or model calls.</div><div className="detail-grid"><div className="detail-content"><span className="content-kicker">AGENT DEMO</span><h2>Find changes worth a conversation.</h2><p>See how an agent could compare quarterly account purchases and suggest a follow-up using lakehouse data.</p><div className="example-answer"><span>EXAMPLE QUESTION</span><p>Which accounts saw the largest drop in purchases this quarter?</p></div><button className="button button-dark" onClick={run} disabled={running}><ChartNoAxesCombined size={16}/>{running?"Simulating…":complete?"Run demo again":"Run agent demo"}<ArrowRight size={15}/></button>{(running||complete)&&<DemoProgress steps={steps} active={stage} complete={complete} simulated/>}{complete&&<section className="iomete-results" aria-live="polite"><span className="content-kicker">ILLUSTRATIVE RESULT / FICTIONAL DATA</span><h3>Account activity</h3><div className="iomete-table">{accounts.map(account=>{const change=Math.round((account.current-account.previous)/account.previous*100);return <div className="iomete-row" key={account.name}><div><strong>{account.name}</strong><small>${account.previous.toLocaleString("en-US")} → ${account.current.toLocaleString("en-US")}</small></div><span className={change<0?"iomete-down":"iomete-up"}>{change>0?"+":""}{change}%</span></div>})}</div><p><strong>Suggested follow-up:</strong> Contact Northstar Retail first; its fictional purchases fell by $17,000.</p></section>}</div><aside className="detail-aside"><span className="content-kicker">AGENT DETAILS</span><div className="aside-row"><span>Category</span><strong>Sales</strong></div><div className="aside-row"><span>Data source</span><strong>Fictional sample</strong></div><div className="aside-row"><span>Connection</span><strong>Not connected</strong></div><div className="aside-note"><p>The live IOMETE integration is a concept. This demo runs entirely in the browser.</p></div></aside></div></div>;
}
