"use client";

import { useState } from "react";
import { DemoProgress } from "./demo-progress";

type Handoff = { question: string; reason: string; facts: string };
type Result = { handoff: Handoff; retrieved: Handoff; answer: string; hash: string; conversationId: string; memoryStatus: "saved" | "failed"; memoryError?: string; answerSource: "model" | "fallback" };

export function MekoDemo() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  async function run() {
    setLoading(true); setStage(0); setError(""); setResult(null);
    try {
      const response = await fetch("/api/demo/meko/stream", { method: "POST" });
      if (!response.ok || !response.body) throw new Error("The demo is unavailable.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let completed = false;
      const stages = ["preparing", "saving", "retrieving", "drafting"];
      while (true) {
        const part = await reader.read(); buffer += decoder.decode(part.value || new Uint8Array(), { stream: !part.done });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line) continue;
          const event = JSON.parse(line) as { type: string; stage?: string; result?: Result; message?: string };
          if (event.type === "progress" && event.stage) setStage(Math.max(0, stages.indexOf(event.stage)));
          if (event.type === "error") throw new Error(event.message || "The demo is unavailable.");
          if (event.type === "complete" && event.result) { setResult(event.result); completed = true; }
        }
        if (part.done) break;
      }
      if (!completed) throw new Error("The handoff ended before a result was received.");
    } catch (err) { setError(err instanceof Error ? err.message : "The demo is unavailable."); }
    finally { setLoading(false); }
  }
  return <section className="business-panel" aria-labelledby="meko-title">
    <span className="business-kicker">01 / MEKO BY YUGABYTEDB</span>
    <h2 id="meko-title">A support handoff that keeps its context</h2>
    <p>A fictional customer asks about an annual-plan refund. The first agent saves the conversation, a demo memory, and a handoff in Meko. A second agent reads the handoff and drafts a response.</p>
    <button className="business-primary" onClick={run} disabled={loading}>{loading ? "Running handoff..." : "Run Meko handoff"}</button>
    {error && <p role="alert">{error}</p>}
    {(loading || result) && <DemoProgress steps={["Prepare handoff", "Save context to Meko", "Retrieve context", "Draft support response"]} active={stage} complete={Boolean(result)} />}
    {result && <div className="business-agents" aria-live="polite">
      <article><h4>01 / Conversation saved</h4><p>{result.handoff.question}</p><p>{result.handoff.reason}</p><p>{result.handoff.facts}</p><small>Conversation ID: {result.conversationId}</small><p>{result.memoryStatus === "saved" ? "Demo memory sent to Meko. Review learnings in Meko before sharing." : `Memory could not be saved: ${result.memoryError}`}</p></article>
      <article><h4>02 / Retrieved from Meko</h4><p>{result.retrieved.question}</p><p>{result.retrieved.reason}</p><p>{result.retrieved.facts}</p><small>Artifact SHA-256: {result.hash}</small></article>
      <article><h4>03 / {result.answerSource === "fallback" ? "Fallback draft" : "Second agent draft"}</h4>{result.answerSource === "fallback" && <p>The model returned no text, so this predefined draft is shown instead.</p>}<p>{result.answer}</p></article>
    </div>}
  </section>;
}
