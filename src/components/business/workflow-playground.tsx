"use client";

import { readApiResponse } from "@/lib/read-api-response";

import { useEffect, useState } from "react";
import styles from "./workflow-playground.module.css";

export function WorkflowPlayground({ unlocked, workflowPath = "/api/business/workflows/support-demo" }: { unlocked: boolean; workflowPath?: string }) {
  const [task, setTask] = useState("How do I invite my team?");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  async function run() {
    setLoading(true); setError(""); setResult("");
    try {
      const response = await fetch(workflowPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task }) });
      const data = await readApiResponse(response) as { result?: string; error?: string };
      if (!response.ok || typeof data.result !== "string") throw new Error(data.error || "Request failed.");
      setResult(data.result);
    } catch (err) { setError(err instanceof Error ? err.message : "Request failed."); }
    finally { setLoading(false); }
  }
  return <section className={styles.page}><p className="business-kicker">WORKFLOW / TRY IT</p><h2>Use the workflow</h2>{!unlocked ? <p>Run and pass the support demo’s sample cases to see its endpoint and try a request here.</p> : <>
    <p>{workflowPath.endsWith("support-demo") ? "Send a text task to the platform-provided support demo. It answers from fixed sample articles and does not run the recommended workflows." : "Send a text task to the tested workflow. Each stage receives the previous stage’s text response."}</p>
    <div className={styles.endpoint}><span>POST</span><code>{origin}{workflowPath}</code></div>
    <p className={styles.note}>{workflowPath.endsWith("support-demo") ? "Demo only. The endpoint is available in this local environment and is not enabled in production." : "Demo endpoint: expires after one hour or a server restart, is not enabled in production, and may trigger actions or costs. Anyone with this URL can use it."}</p>
    <pre className={styles.code}>{JSON.stringify({ task: "How do I invite my team?" }, null, 2)}</pre>
    <label className={styles.label}>Your question<textarea value={task} onChange={(event) => setTask(event.target.value)} maxLength={4000} rows={4} /></label>
    <button type="button" className="business-primary" disabled={loading || !task.trim()} onClick={() => { setOrigin(window.location.origin); void run(); }}>{loading ? "Sending…" : "Send request"}</button>
    {error && <p role="alert">{error}</p>}{result && <div className={styles.response}><span>RESPONSE</span><p>{result}</p><pre className={styles.code}>{JSON.stringify({ result }, null, 2)}</pre></div>}
  </>}</section>;
}
