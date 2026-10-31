"use client";

import { useState } from "react";

type Handoff = { question: string; reason: string; facts: string };
type Result = { handoff: Handoff; retrieved: Handoff; answer: string; hash: string };

export function MekoDemo() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/demo/meko", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The demo is unavailable.");
      setResult(data as Result);
    } catch (err) { setError(err instanceof Error ? err.message : "The demo is unavailable."); }
    finally { setLoading(false); }
  }
  return <section className="business-panel" aria-labelledby="meko-title">
    <span className="business-kicker">01 / MEKO BY YUGABYTEDB</span>
    <h2 id="meko-title">A support handoff that keeps its context</h2>
    <p>A fictional customer asks about an annual-plan refund. The first support agent has no refund policy, so it saves a handoff in Meko. A second agent reads that handoff and drafts a response.</p>
    <button className="business-primary" onClick={run} disabled={loading}>{loading ? "Running handoff..." : "Run Meko handoff"}</button>
    {error && <p role="alert">{error}</p>}
    {result && <div className="business-agents" aria-live="polite">
      <article><h4>01 / Handoff saved</h4><p>{result.handoff.question}</p><p>{result.handoff.reason}</p><p>{result.handoff.facts}</p></article>
      <article><h4>02 / Retrieved from Meko</h4><p>{result.retrieved.question}</p><p>{result.retrieved.reason}</p><p>{result.retrieved.facts}</p><small>Artifact SHA-256: {result.hash}</small></article>
      <article><h4>03 / Second agent draft</h4><p>{result.answer}</p></article>
    </div>}
  </section>;
}
