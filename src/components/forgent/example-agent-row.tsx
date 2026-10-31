import Link from "next/link";
import { ArrowUpRight, Braces, FileSearch, FileText, Megaphone, Radar, SquareCode } from "lucide-react";
import { demoPrice } from "@/data/demo-listing";
import type { ExampleAgent } from "@/data/example-agents";
const icons: Record<string, typeof Braces> = {"Data extraction":Braces,"Research":FileSearch,"Developer tools":SquareCode,"Sales":Radar,"Content":FileText,"Operations":Megaphone};
export function ExampleAgentRow({agent}:{agent:ExampleAgent}) {
  const Icon=icons[agent.category] || Braces;
  return <Link className="agent-row" href={`/agents/${agent.id}`}><div className="agent-main"><span className="support-icon"><Icon size={22} strokeWidth={1.7}/></span><div><div className="agent-name">{agent.name} <ArrowUpRight size={15}/></div><p>{agent.description}</p><div className="tag-row"><span>{agent.category}</span>{agent.tags.slice(0,2).map(tag=><span key={tag}>{tag}</span>)}</div></div></div><div className="agent-meta"><div><span className="meta-label">EXAMPLE PRICE / RUN</span><strong>${demoPrice(agent.id)} · Text demo</strong></div><span className="row-arrow"><ArrowUpRight size={17}/></span></div></Link>;
}
