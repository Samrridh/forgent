"use client";

import { useState, type FormEvent } from "react";
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
  return <div className="business-workspace">
    <header className="business-heading"><p>BUSINESS WORKSPACE · DEMO</p><h1>Work, defined clearly.</h1><span>Describe the outcome you need and review agents for your workflow.</span></header>
    <nav className="business-tabs" aria-label="Business workspace">{([["overview", "Overview"], ["job", "New job"], ["candidates", "Candidates"]] as const).map(([id, label]) => <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === "overview" && <section className="business-panel"><p className="business-kicker">NORTHSTAR LOGISTICS · DEMO ACCOUNT</p><h2>Start with the work, not an agent.</h2><p>Describe your goal and review suggested agents and workflows. Recommendations are not execution tests.</p><button className="business-primary" onClick={() => setTab("job")}>Describe a job</button></section>}
    {tab === "job" && <section className="business-panel"><p className="business-kicker">01 / JOB INTAKE</p><h2>What do you need done?</h2><p>Share the outcome, the data involved, and the rules that matter. Leave an answer blank if you need help defining it.</p><form onSubmit={submit} className="business-form"><label>Business outcome<textarea required minLength={10} maxLength={4000} value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Compare purchase orders with receiving records and flag discrepancies." /></label>{fields.map(([key, label, placeholder]) => <label key={key}>{label}<textarea maxLength={2000} value={details[key]} onChange={(e) => setDetails({ ...details, [key]: e.target.value })} placeholder={placeholder} /></label>)}<label>Prisma schema <span>Optional · .prisma, up to 200 KB</span><input type="file" accept=".prisma" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) { setSchema(""); return; } if (file.size > 200000) { setError("Schema exceeds the 200 KB limit."); e.target.value = ""; setSchema(""); return; } setError(""); setSchema(await file.text()); }} /></label><p>The schema is parsed without connecting to your database. The extracted model descriptions and your answers may be sent to Gemini when configured. Do not include secrets or real customer data.</p>{error && <p role="alert">{error}</p>}<button className="business-primary" disabled={loading}>{loading ? "Preparing candidates…" : "Find candidates"}</button></form></section>}
    {tab === "candidates" && <section className="business-panel"><p className="business-kicker">02 / CANDIDATES</p><h2>Review your options</h2>{!result ? <p>Describe a job first to see candidates.</p> : <><p>Method: {result.mode === "gemini" ? "Gemini-assisted" : "Offline keyword matching"}. No audition has run.</p>{result.notices.map((notice) => <p key={notice}>{notice}</p>)}{result.questions.length > 0 && <><h3>Questions to clarify</h3><form onSubmit={submit} className="business-form">{result.questions.map((question) => <label key={question}>{question}<textarea maxLength={2000} value={answers[question] || ""} onChange={(event) => setAnswers({ ...answers, [question]: event.target.value })} /></label>)}{error && <p role="alert">{error}</p>}<button className="business-primary" disabled={loading}>{loading ? "Updating candidates…" : "Update candidates"}</button></form><button className="business-primary" onClick={() => setTab("job")}>Edit job details</button></>}<h3>Schema review</h3>{result.description.models.length ? result.description.models.map((model) => <div key={model.name}><strong>{model.name}</strong><p>{model.fields.map((field) => `${field.name}: ${field.type}${field.list ? "[]" : field.optional ? "?" : ""}`).join(", ")}</p></div>) : <p>No complete models provided.</p>}{result.description.warnings.map((warning) => <p key={warning}>{warning}</p>)}<h3>Suggested candidates</h3>{result.candidates.length === 0 && <p>No candidates could be proposed from the available agent descriptions. Add more detail or try again when Gemini is configured.</p>}{result.candidates.map((candidate) => <article className="business-candidate" key={candidate.id}><h4>{candidate.title}</h4><p>{candidate.rationale}</p>{candidate.agentIds.length > 1 && <CandidateGraph stages={candidate.agentIds.map((id, index) => ({ id, label: agentsById.get(id)?.name || id, dependsOn: index ? [candidate.agentIds[index - 1]] : [] }))} />}{candidate.agentIds.map((id) => { const agent = agentsById.get(id); return agent && <div key={id}><strong>{agent.name}</strong><p>{agent.summary}</p><p>₹{(agent.pricePaise / 100).toLocaleString("en-IN")} · {agent.latencyMs} ms estimated · Permissions: {agent.permissions.join(", ") || "none declared"}</p></div>; })}<ul>{candidate.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></article>)}</>}</section>}
  </div>;
}
