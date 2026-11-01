"use client";

import { readApiResponse } from "@/lib/read-api-response";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Compass, KeyRound, LayoutDashboard, ListChecks, Plus, Workflow, FlaskConical, Terminal } from "lucide-react";
import { CandidateCard } from "./candidate-card";
import { JobIntakeForm } from "./job-intake-form";
import { DemoWorkflow } from "./demo-workflow";
import { WorkflowPlayground } from "./workflow-playground";
import { SchemaReview } from "./schema-review";
import { HOSTED_SAMPLE_AGENT_ID } from "@/lib/contracts/hosted-sample-fixtures";
import type { BusinessRequest, CompilerOutput } from "@/server/compiler/business-compiler-contracts";

type Tab = "overview" | "job" | "candidates" | "demo" | "try";


export function BusinessDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [objective, setObjective] = useState("");
  const [details, setDetails] = useState({ inputs: "", outputs: "", rules: "", constraints: "" });
  const [schema, setSchema] = useState("");
  const [result, setResult] = useState<CompilerOutput | null>(null);
  const [submittedRequest, setSubmittedRequest] = useState<BusinessRequest | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [demoPassed, setDemoPassed] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const requirements = { objective, schema, ...details, answers: Object.entries(answers).filter(([, answer]) => answer.trim()).map(([question, answer]) => ({ question, answer: answer.trim() })) };
      const response = await fetch("/api/business/recommendations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requirements) });
      const data: unknown = await readApiResponse(response);
      if (!response.ok) throw new Error("Could not prepare candidates. Check the requirements and try again.");
      setResult(data as CompilerOutput); setSubmittedRequest(requirements); setTab("candidates");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not prepare candidates."); }
    finally { setLoading(false); }
  }
  const agentsById = new Map(result?.agents.map((agent) => [agent.id, agent]));
  const navigation = [["overview", "Overview", LayoutDashboard], ["job", "Describe a job", Plus], ["candidates", "Candidates", Workflow], ["demo", "Demo workflow", FlaskConical], ["try", "Try workflow", Terminal]] as const;
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
        <div className="enterprise-dashboard-note"><strong>About this workspace</strong><p>This is a local demo. Recommendations suggest possible workflows. You can review test cases and run them against your own test endpoint.</p></div>
      </section>}
    {tab === "job" && <JobIntakeForm objective={objective} setObjective={setObjective} details={details} setDetails={setDetails} schema={schema} setSchema={setSchema} error={error} setError={setError} loading={loading} onSubmit={submit} />}
    <div hidden={tab !== "demo"}><DemoWorkflow onPass={setDemoPassed} passed={demoPassed} onTry={() => setTab("try")} /></div>
    {tab === "try" && <WorkflowPlayground unlocked={demoPassed} />}
    {tab === "candidates" && <section className="business-panel"><p className="business-kicker">02 / CANDIDATES</p><h2>Review your options</h2>{!result ? <p>Describe a job first to see candidates.</p> : <><p>Method: {result.mode === "gemini" ? "Gemini-assisted" : "Offline keyword matching"}. Recommendations have not been independently tested.</p>{result.notices.map((notice) => <p key={notice}>{notice}</p>)}{result.questions.length > 0 && <details className="mt-6"><summary className="cursor-pointer font-semibold">Refine these recommendations ({result.questions.length} questions)</summary><form onSubmit={submit} className="business-form">{result.questions.map((question) => <label key={question}>{question}<textarea maxLength={2000} value={answers[question] || ""} onChange={(event) => setAnswers({ ...answers, [question]: event.target.value })} /></label>)}{error && <p role="alert">{error}</p>}<button className="business-primary" disabled={loading}>{loading ? "Updating candidates…" : "Update candidates"}</button></form><button className="business-primary" onClick={() => setTab("job")}>Edit job details</button></details>}<SchemaReview description={result.description} /><h3>Suggested candidates</h3>{result.candidates.length === 0 && <p>No candidates could be proposed from the available agent descriptions. Add more detail or try again when Gemini is configured.</p>}{result.candidates.map((candidate, index) => <CandidateCard key={JSON.stringify({ candidate, submittedRequest })} candidate={candidate} agents={agentsById} requirements={submittedRequest} index={index} />)}{agentsById.has(HOSTED_SAMPLE_AGENT_ID) && !result.candidates.some((candidate) => candidate.agentIds.includes(HOSTED_SAMPLE_AGENT_ID)) && <><h3>Try a runnable demo</h3><p>This platform sample answers questions using fixed support articles. It is separate from the recommendations for your job.</p><CandidateCard candidate={{ id: "platform-support-demo", title: "Support knowledge workflow (demo)", rationale: "A platform-provided sample for reviewing tests and trying a workflow endpoint.", agentIds: [HOSTED_SAMPLE_AGENT_ID], warnings: ["Uses fixed sample articles and does not process your business data."] }} agents={agentsById} requirements={submittedRequest} index={result.candidates.length} /></>}</>}</section>}
    </div>
  </div>;
}
