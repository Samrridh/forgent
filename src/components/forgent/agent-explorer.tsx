"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { runnableProjectAgents } from "@/data/project-example-agents";
import { exampleAgents } from "@/data/example-agents";
import { AgentRow, Eyebrow, PreviewNote, SupportIcon } from "./ui";
import { ExampleAgentRow } from "./example-agent-row";

interface Listing { id:string; name:string; description:string; priceMicros?:number }
const categories=["All agents","Customer support",...new Set(exampleAgents.map(agent=>agent.category).filter(category=>category!=="Customer support"))];
const stopWords=new Set(["the","and","for","that","with","want","need","agent","can","from","into","this","which","they","could","would","like"]);
function searchMatches(query:string, text:string) {
 const terms=query.toLowerCase().match(/[a-z0-9]+/g)?.filter(word=>word.length>=3&&!stopWords.has(word)) || [];
 return !terms.length || terms.some(term=>text.toLowerCase().includes(term));
}
export function AgentExplorer(){
 const [query,setQuery]=useState("");
 useEffect(()=>{setQuery(new URLSearchParams(window.location.search).get("q")||"")},[]);
 const [category,setCategory]=useState("All agents");
 const [published,setPublished]=useState<Listing[]>([]);
 useEffect(()=>{fetch("/api/v1/agents").then(r=>{if(!r.ok)throw new Error("Catalog unavailable");return r.json();}).then((data:{agents:Listing[]})=>setPublished(data.agents.filter(a=>a.id!=="knowledge-support"&&!runnableProjectAgents.some(agent=>agent.id===a.id)))).catch(()=>setPublished([]));},[]);
 const supportVisible=(category==="All agents"||category==="Customer support")&&searchMatches(query,"support knowledge docs document discord answer customer community human questions");
 const other=(category==="All agents"||category==="Customer support")?published.filter(agent=>searchMatches(query,`${agent.name} ${agent.description} support knowledge discord`)):[];
 const examples=exampleAgents.filter(agent=>(category==="All agents"||category===agent.category)&&searchMatches(query,`${agent.name} ${agent.category} ${agent.description} ${agent.tags.join(" ")}`));
 const total=Number(supportVisible)+other.length+examples.length;
 const count=(name:string)=>name==="All agents"?1+published.length+exampleAgents.length:name==="Customer support"?1+published.length+exampleAgents.filter(agent=>agent.category===name).length:exampleAgents.filter(agent=>agent.category===name).length;
 return <div className="page-width inner-page"><div className="catalog-hero"><div><Eyebrow>THE AGENT CATALOG</Eyebrow><h1>Find your kind<br/>of agent<span className="green-text">.</span></h1><p>Explore specialized services and see how each one could fit your workflow.</p></div><div className="catalog-hero-index"><span>THE DIRECTORY</span><strong>{exampleAgents.length + 1}</strong><p>services and ideas to explore</p><span>ONE API / MANY POSSIBILITIES</span></div></div><PreviewNote>60 text-only agent adaptations and the support demo can be run. Other listings are previews; all pricing is illustrative.</PreviewNote><div className="explore-layout"><aside className="explore-sidebar"><span className="side-label">EXPLORE</span>{categories.map(item=><button key={item} className={category===item?"side-active catalog-category":"side-link catalog-category"} onClick={()=>setCategory(item)} aria-pressed={category===item}>{item}<span>{String(count(item)).padStart(2,"0")}</span></button>)}<div className="side-divider"/><div className="side-callout"><Sparkles size={17}/><strong>Building an agent?</strong><p>Make your work discoverable to developers.</p><Link href="/publish">Learn more <ArrowRight size={14}/></Link></div></aside><div className="explore-content"><label className="search-box"><Search size={19}/><span className="sr-only">Search agents</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search agents, categories, or capabilities..."/><span>SEARCH</span></label><div className="catalog-mobile-filter"><label htmlFor="agent-category" className="sr-only">Agent category</label><select id="agent-category" className="form-input" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(item=><option key={item} value={item}>{item} ({count(item)})</option>)}</select></div><div className="list-heading"><div><h2>{category==="All agents"?"Explore agents":category}</h2><p>Working demos and illustrative catalog examples.</p></div><span>{String(total).padStart(2,"0")} AGENT{total===1?"":"S"}</span></div><div className="catalog-header"><span>AGENT / CAPABILITY</span><span>AVAILABILITY</span></div>{supportVisible&&<AgentRow/>}{other.map(a=><Link className="agent-row" href={`/agents/${a.id}`} key={a.id}><div className="agent-main"><SupportIcon/><div><div className="agent-name">{a.name}</div><p>{a.description}</p><div className="tag-row"><span>Customer support</span><span>Passed benchmark</span></div></div></div><div className="agent-meta"><div><span className="meta-label">LISTED PRICE / RUN</span><strong>${((a.priceMicros||0)/1_000_000).toFixed(6)}</strong></div></div></Link>)}{examples.map(agent=><ExampleAgentRow key={agent.id} agent={agent}/>)}{total===0&&<div className="empty-results">No agents found. Try another search or category.</div>}</div></div></div>;
}
