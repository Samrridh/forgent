"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Compass, KeyRound, LayoutDashboard, ListChecks, Plus, Workflow } from "lucide-react";
import { CandidateGraph } from "./candidate-graph";
import type { CompilerOutput } from "@/server/compiler/business-compiler-contracts";

type Tab = "overview" | "job" | "candidates";
const fields = [
  ["inputs", "Available inputs", "What documents or records are available?"],
  ["outputs", "Expected output", "What should the workflow produce?"],
  ["rules", "Business rules", "How will you judge a correct result?"],
  ["constraints", "Boundaries", "What data or actions must be restricted?"],
] as const;

export function BusinessDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [objective, setObjective] = useState("");
  const [details, setDetails] = useState({ inputs: "", outputs: "", rules: "", constraints: "" });
  const [schema, setSchema] = useState("");
  const [result, setResult] = useState<CompilerOutput | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/business/recommendations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ objective, schema, ...details, answers: Object.entries(answers).filter(([, answer]) => answer.trim()).map(([question, answer]) => ({ question, answer: answer.trim() })) }) });
      const data: unknown = await response.json();
      if (!response.ok) throw new Error("Could not prepare candidates. Check the requirements and try again.");
      setResult(data as CompilerOutput); setTab("candidates");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not prepare candidates."); }
    finally { setLoading(false); }
  }
  const agentsById = new Map(result?.agents.map((agent) => [agent.id, agent]));
  const navigation = [["overview", "Overview", LayoutDashboard], ["job", "Describe a job", Plus], ["candidates", "Candidates", Workflow]] as const;
  return <div className="enterprise-dashboard page-width">
    <aside className="enterprise-dashboard-sidebar" aria-label="Enterprise workspace navigation">
      <div className="enterprise-dashboard-brand"><span className="enterprise-dashboard-mark"><Workflow size={18}/></span><div><strong>Enterprise</strong><small>DEMO WORKSPACE</small></div></div>
      <span className="enterprise-dashboard-label">WORKSPACE</span>
      <nav>{navigation.map(([id, label, Icon]) => <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}><Icon size={17}/>{label}</button>)}</nav>
      <span className="enterprise-dashboard-label">QUICK LINKS</span>
      <nav><Link href="/agents"><Compass size={17}/>Explore agents</Link><Link href="/console"><KeyRound size={17}/>API console</Link></nav>
    </aside>
    <div className="enterprise-dashboard-main">
      <div className="enterprise-dashboard-top"><span>ENTERPRISE / {tab === "job" ? "DESCRIBE A JOB" : tab.toUpperCase()}</span><span>LOCAL DEMO</span></div>
      {tab === "overview" && <section className="enterprise-dashboard-overview"><div className="enterprise-dashboard-heading"><div><p className="business-kicker">YOUR WORKSPACE</p><h1>What would you like to build?</h1><p>Describe the work your team needs done and review suggested agents.</p></div><button className="business-primary" onClick={() => setTab("job")}><Plus size={16}/> Describe a job</button></div>
        <div className="enterprise-dashboard-summary"><article><span>01 / DEFINE</span><ListChecks size={21}/><h2>Describe the outcome</h2><p>Share your inputs, expected output, and the rules that matter.</p><button onClick={() => setTab("job")}>Start a job <ArrowRight size={15}/></button></article><article><span>02 / REVIEW</span><Workflow size={21}/><h2>Compare candidates</h2><p>Review suggested agents and workflows based on your requirements.</p><button onClick={() => setTab("candidates")}>View candidates <ArrowRight size={15}/></button></article><article><span>03 / CONNECT</span><KeyRound size={21}/><h2>Use the API</h2><p>Create an API key and connect an available agent to your application.</p><Link href="/console">Open API console <ArrowRight size={15}/></Link></article></div>
        <div className="enterprise-dashboard-note"><strong>About this workspace</strong><p>This is a local demo. Recommendations suggest possible workflows; they do not run or evaluate agents.</p></div>
      </section>}
    {tab === "job" && <section className="business-panel"><p className="business-kicker">01 / JOB INTAKE</p><h2>What do you need done?</h2><p>Share the outcome, the data involved, and the rules that matter. Leave an answer blank if you need help defining it.</p><form onSubmit={submit} className="business-form"><label>Business outcome<textarea required minLength={10} maxLength={4000} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Compare purchase orders with receiving records and flag discrepancies." /></label>{fields.map(([key, label, placeholder]) => <label key={key}>{label}<textarea maxLength={2000} value={details[key]} onChange={(e) => setDetails({ ...details, [key]: e.target.value })} placeholder={placeholder} /></label>)}<label>Prisma schema <span>Optional · .prisma, up to 200 KB</span><input type="file" accept=".prisma" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) { setSchema(""); return; } if (file.size > 200000) { setError("Schema exceeds the 200 KB limit."); e.target.value = ""; setSchema(""); return; } setError(""); setSchema(await file.text()); }} /></label><p>The schema is parsed without connecting to your database. The extracted model descriptions and your answers may be sent to Gemini when configured. Do not include secrets or real customer data.</p>{error && <p role="alert">{error}</p>}<button className="business-primary" disabled={loading}>{loading ? "Preparing candidates…" : "Find candidates"}</button></form></section>}
    {tab === "candidates" && <section className="business-panel"><p className="business-kicker">02 / CANDIDATES</p><h2>Review your options</h2>{!result ? <p>Describe a job first to see candidates.</p> : <><p>Method: {result.mode === "gemini" ? "Gemini-assisted" : "Offline keyword matching"}. No audition has run.</p>{result.notices.map((notice) => <p key={notice}>{notice}</p>)}{result.questions.length > 0 && <><h3>Questions to clarify</h3><form onSubmit={submit} className="business-form">{result.questions.map((question) => <label key={question}>{question}<textarea maxLength={2000} value={answers[question] || ""} onChange={(event) => setAnswers({ ...answers, [question]: event.target.value })} /></label>)}{error && <p role="alert">{error}</p>}<button className="business-primary" disabled={loading}>{loading ? "Updating candidates…" : "Update candidates"}</button></form><button className="business-primary" onClick={() => setTab("job")}>Edit job details</button></>}<h3>Schema review</h3>{result.description.models.length ? result.description.models.map((model) => <div key={model.name}><strong>{model.name}</strong><p>{model.fields.map((field) => `${field.name}: ${field.type}${field.list ? "[]" : field.optional ? "?" : ""}`).join(", ")}</p></div>) : <p>No complete models provided.</p>}{result.description.warnings.map((warning) => <p key={warning}>{warning}</p>)}<h3>Suggested candidates</h3>{result.candidates.length === 0 && <p>No candidates could be proposed from the available agent descriptions. Add more detail or try again when Gemini is configured.</p>}{result.candidates.map((candidate) => <article className="business-candidate" key={candidate.id}><h4>{candidate.title}</h4><p>{candidate.rationale}</p>{candidate.agentIds.length > 1 && <CandidateGraph stages={candidate.agentIds.map((id, index) => ({ id, label: agentsById.get(id)?.name || id, dependsOn: index ? [candidate.agentIds[index - 1]] : [] }))} />}{candidate.agentIds.map((id) => { const agent = agentsById.get(id); return agent && <div key={id}><strong>{agent.name}</strong><p>{agent.summary}</p><p>₹{(agent.pricePaise / 100).toLocaleString("en-IN")} · {agent.latencyMs} ms estimated · Permissions: {agent.permissions.join(", ") || "none declared"}</p></div>; })}<ul>{candidate.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></article>)}</>}</section>}
    </div>
  </div>;
}
