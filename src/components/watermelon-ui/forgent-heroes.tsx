"use client";
// Adapted from Watermelon UI Hero 39, Hero 11 and Hero 2 (MIT).
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { motion } from "motion/react";
import { SharedNavigation } from "@/components/forgent/shared-navigation";



const searchExamples = ["Find an agent for customer support...", "Find an agent to research a topic...", "Find an agent to help with code..."];
function useSearchPlaceholder() {
 const [placeholder,setPlaceholder]=useState(searchExamples[0]);
 useEffect(()=>{
  if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  let phrase=0, length=0, deleting=false, timer:ReturnType<typeof setTimeout>;
  const tick=()=>{const text=searchExamples[phrase];length+=deleting?-1:1;setPlaceholder(text.slice(0,length));if(length===text.length){deleting=true;timer=setTimeout(tick,1800)}else if(length===0){deleting=false;phrase=(phrase+1)%searchExamples.length;timer=setTimeout(tick,350)}else timer=setTimeout(tick,deleting?30:65)};
  timer=setTimeout(()=>{setPlaceholder("");tick()},500);
  return ()=>clearTimeout(timer);
 },[]);
 return placeholder;
}
export function ForgentHero39(){const [query,setQuery]=useState("");const placeholder=useSearchPlaceholder();const router=useRouter();return <section className="wm-hero wm-hero39"><div className="wm-bg wm-bg39"/><div className="wm-hero-inner"><SharedNavigation hero light/><motion.div className="wm39-content" initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.7}}><span className="wm39-pill"><i/>THE AGENT LAYER FOR DEVELOPERS</span><h1>Great agents.<br/>One <em>connection.</em></h1><p>Discover specialized AI agents and bring them into your application through one API.</p><form className="wm39-search" onSubmit={event=>{event.preventDefault();router.push(`/agents?q=${encodeURIComponent(query)}`)}}><Search size={20}/><label className="sr-only" htmlFor="hero-search">Search agents</label><input id="hero-search" value={query} onChange={event=>setQuery(event.target.value)} placeholder={placeholder}/><button type="submit">Explore agents</button></form></motion.div><div className="wm39-bottom"><p>ONE API. MANY POSSIBILITIES.</p><div><span>Research</span><span>Support</span><span>Development</span><span>Operations</span></div></div></div></section>}

export function ForgentHero11(){return <section className="wm-hero wm-hero11"><div className="wm-bg wm-bg11"/><div className="wm11-overlay"/><div className="wm-hero-inner"><SharedNavigation hero/><motion.div className="wm11-content" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.7}}><h1>One connection. <br/>More capable teams.</h1><p>Discover specialized agents, understand how they are evaluated, and integrate them through one API.</p><Link className="wm11-button" href="#workspace">Open business workspace <ArrowRight size={15}/></Link></motion.div></div></section>}

export function ForgentHero2(){return <section className="wm-hero wm-hero2"><div className="wm-bg wm-bg2"/><div className="wm-hero-inner"><SharedNavigation hero/><motion.div className="wm2-content" initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.7}}><h1>Build the agent.<br/>We host the <em>service.</em></h1><p>Share your agent, define its interface, and reach developers building their next application.</p><div className="wm2-actions"><a className="wm2-primary" href="#submit">Submit an agent <ArrowRight size={16}/></a><Link className="wm2-secondary" href="/builders/forgent-labs">View builder profile</Link></div></motion.div><div className="wm2-bottom"><div><span>BUILD</span><span>EVALUATE</span><span>PUBLISH</span></div><a href="#submit">Scroll to discover ↓</a></div></div></section>}
