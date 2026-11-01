"use client";

import { readApiResponse } from "@/lib/read-api-response";

import { useState, type FormEvent } from "react";
import type { PackageReview } from "@/server/builder/evaluation/package-review-contract";
import { ProposedTestCards } from "@/components/builder/proposed-test-cards";

type Tab = "overview" | "submit" | "report" | "profile";
type Report = { report: PackageReview; filesReviewed: string[]; evaluatedAt: string };
const schemaExample = JSON.stringify({ type: "object", properties: {}, required: [] }, null, 2);

export function BuilderWorkspace({ embedded = false }: { embedded?: boolean }) {
  const [tab, setTab] = useState<Tab>(embedded ? "submit" : "overview");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inputSchema, setInputSchema] = useState(schemaExample);
  const [outputSchema, setOutputSchema] = useState(schemaExample);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) { setError("Choose a ZIP package."); return; }
    const form = new FormData();
    form.set("name", name); form.set("description", description); form.set("inputSchema", inputSchema); form.set("outputSchema", outputSchema); form.set("package", file);
    setError(""); setLoading(true);
    try {
      const response = await fetch("/api/builder/package-review", { method: "POST", body: form });
      const data = await readApiResponse(response) as Report & { error?: string };
      if (!response.ok) throw new Error(data.error || "Review failed.");
      setResult(data); setTab("report");
    } catch (err) { setError(err instanceof Error ? err.message : "Review failed."); }
    finally { setLoading(false); }
  }
  return <div className={embedded ? "" : "business-workspace"}>
    {!embedded && <header className="business-heading"><p>BUILDER WORKSPACE · DEMO</p><h1>Build with clarity.</h1><span>Describe an agent, submit its contract, and review its package.</span></header>}
    <nav className="business-tabs" aria-label="Package review navigation">{(embedded ? ([["submit", "Submit agent"], ["report", "Review"]] as const) : ([["overview", "Overview"], ["submit", "Submit agent"], ["report", "Review"], ["profile", "Profile"]] as const)).map(([id, label]) => <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === "overview" && <section className="business-panel"><p className="business-kicker">BUILDER / DEMO</p><h2>Start with an agent package.</h2><p>Submit a Node.js source package and its input and output schemas for an AI-assisted static review. The review does not execute the agent or produce a performance rating.</p><button className="business-primary" onClick={() => setTab("submit")}>Submit an agent</button></section>}
    {tab === "submit" && <section className="business-panel"><p className="business-kicker">01 / AGENT DETAILS</p><h2>Tell us about your agent.</h2><form className="business-form" onSubmit={review}>
      <label>Agent name<input required minLength={3} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label>Description<textarea required minLength={10} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the agent's purpose, behavior, and limits." /></label>
      <label>Input JSON Schema<textarea required maxLength={20000} value={inputSchema} onChange={(e) => setInputSchema(e.target.value)} /></label>
      <label>Output JSON Schema<textarea required maxLength={20000} value={outputSchema} onChange={(e) => setOutputSchema(e.target.value)} /></label>
      <label>Node.js source ZIP <span>Source and documentation only · 1 MB compressed, 200 KB uncompressed</span><input required type="file" accept=".zip,application/zip" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
      <p>The submitted source, description, and schemas are sent to Gemini for review. Remove secrets, personal data, and proprietary content you cannot share. This demo does not save the package or report.</p>
      {error && <p role="alert">{error}</p>}<button className="business-primary" disabled={loading}>{loading ? "Reviewing package…" : "Run static review"}</button>
    </form></section>}
    {tab === "report" && <section className="business-panel"><p className="business-kicker">02 / REVIEW</p><h2>Static review</h2>{!result ? <p>Submit an agent to generate a review.</p> : <><p>AI-assisted code inspection. The package was not executed and no runtime, performance, or security tests were performed.</p><h3>Summary</h3><p>{result.report.summary}</p><p>Files reviewed: {result.filesReviewed.join(", ")}</p><h3>Findings</h3>{result.report.findings.length ? result.report.findings.map((finding, index) => <article className="business-candidate" key={index}><p className="business-kicker">{finding.category} · {finding.severity}</p><h4>{finding.summary}</h4><p><strong>Evidence:</strong> {finding.evidence}</p><p><strong>Suggested action:</strong> {finding.recommendation}</p></article>) : <p>No findings were returned. This does not establish that the agent is safe or correct.</p>}<h3>Proposed tests</h3><ProposedTestCards tests={result.report.proposedTests} /><h3>Limitations</h3><ul>{result.report.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul></>}</section>}
    {tab === "profile" && <section className="business-panel"><p className="business-kicker">BUILDER / PROFILE</p><h2>Demo builder</h2><p>This is a shared demo profile. Agent submissions, reviews, and account statistics are not saved.</p><p>Published agents: unavailable · Evaluations: unavailable</p></section>}
  </div>;
}
