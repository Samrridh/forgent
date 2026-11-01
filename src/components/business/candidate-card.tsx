"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { CandidateGraph } from "./candidate-graph";
import { CandidateEvaluation } from "./candidate-evaluation";
import type { BusinessRequest, CompilerAgent, CompilerOutput } from "@/server/compiler/business-compiler-contracts";
import styles from "./candidate-card.module.css";
import { HOSTED_SAMPLE_AGENT_ID } from "@/lib/contracts/hosted-sample-fixtures";

function ReadableText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 420;
  const visible = isLong && !expanded ? `${text.slice(0, 420).trimEnd()}…` : text;
  const lines = visible.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return <div className={styles.generatedText}>{lines.map((line, index) => <p key={index}>{line.replace(/^#{1,6}\s+/, "").replace(/^[-*]\s+/, "• ").replace(/\*\*([^*]+)\*\*/g, "$1")}</p>)}{isLong && <button className={styles.textToggle} type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "Show less" : "Read more"}</button>}</div>;
}

export function CandidateCard({ candidate, agents, requirements, index }: { candidate: CompilerOutput["candidates"][number]; agents: Map<string, CompilerAgent>; requirements: BusinessRequest | null; index: number }) {
  return <article className={styles.candidate}>
    <div className={styles.heading}><div><span className={styles.eyebrow}>CANDIDATE {String(index + 1).padStart(2, "0")} / {candidate.agentIds.length === 1 ? "SINGLE AGENT" : `${candidate.agentIds.length} STAGES`}</span><h4>{candidate.title}</h4></div></div>
    <div className={styles.rationale}><span className={styles.sectionLabel}>WHY THIS CANDIDATE</span><ReadableText text={candidate.rationale} /></div>
    <div className={styles.graph}><CandidateGraph stages={candidate.agentIds.map((id, i) => ({ id, label: agents.get(id)?.name || id, dependsOn: i ? [candidate.agentIds[i - 1]] : [] }))} /></div>
    <details className={styles.disclosure}><summary>Agent details <ChevronDown size={16} /></summary><div className={styles.disclosureBody}>
      <ol className={styles.agentList}>{candidate.agentIds.map((id, i) => { const agent = agents.get(id); return agent && <li key={id}><span className={styles.step}>{String(i + 1).padStart(2, "0")}</span><div><strong>{agent.name}</strong><ReadableText text={agent.summary} /><div className={styles.meta}><span>₹{(agent.pricePaise / 100).toLocaleString("en-IN")}</span><span>{agent.latencyMs} ms estimated</span><span>Permissions: {agent.permissions.join(", ") || "none declared"}</span></div></div></li>; })}</ol>
    </div></details>
    {candidate.warnings.length > 0 && <details className={styles.disclosure}><summary>Points to review <span className={styles.count}>{candidate.warnings.length}</span><ChevronDown size={16} /></summary><ul className={styles.warnings}>{candidate.warnings.map((warning, i) => <li key={i}><ReadableText text={warning} /></li>)}</ul></details>}
    {requirements && <details className={styles.disclosure} open={candidate.agentIds.length === 1 && candidate.agentIds[0] === HOSTED_SAMPLE_AGENT_ID ? true : undefined}><summary>Test this candidate <ChevronDown size={16} /></summary><div className={styles.disclosureBody}><CandidateEvaluation requirements={requirements} candidate={candidate} /></div></details>}
  </article>;
}
