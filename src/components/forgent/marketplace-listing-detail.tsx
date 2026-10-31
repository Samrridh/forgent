"use client";
import { useState } from "react";
import Link from "next/link";

export function MarketplaceListingDetail({ listing }: { listing: { id: string; name: string; description: string; category: string; pricePaise: number } }) {
  const [task, setTask] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  async function run() {
    const id = requestId || crypto.randomUUID();
    setRequestId(id); setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/marketplace/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId: listing.id, requestId: id, task, paymentMode: "DEMO_BYPASS" }) });
      const data = await response.json() as { order?: { status: string; result?: { text?: string } }; error?: string };
      if (!response.ok) { if (data.order?.status === "FAILED") setRequestId(""); throw new Error(data.error || "Could not complete the request."); }
      if (data.order?.status === "COMPLETED" && data.order.result?.text) setAnswer(data.order.result.text);
      else setMessage(data.order?.status === "RUNNING" ? "This request is still running. Check My requests before retrying." : "The outcome is unknown. Check with the builder before submitting again.");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Could not complete the request."); }
    finally { setBusy(false); }
  }
  return <div className="page-width inner-page"><Link className="back-link" href="/agents">← All agents</Link><div className="detail-heading"><div><span className="content-kicker">BUILDER-HOSTED AGENT · {listing.category}</span><h1>{listing.name}</h1><p>{listing.description}</p></div></div><div className="preview-note">Hackathon demo: your request is sent to the builder’s endpoint. No payment is collected. Demo users share the same request history; do not submit private information.</div><div className="detail-grid"><main className="detail-content"><h2>What would you like to do?</h2><p>Tell the agent what you need, including any details it needs to respond.</p><label className="field-label" htmlFor="marketplace-task">YOUR REQUEST</label><textarea id="marketplace-task" className="form-input playground-input" disabled={busy} maxLength={4000} value={task} onChange={event => { setTask(event.target.value); setRequestId(""); setAnswer(""); setCheckout(false); }} placeholder="Describe your task…"/><button className="button button-dark" disabled={busy || task.trim().length < 5} onClick={() => setCheckout(true)}>Continue to checkout</button>{checkout && <section className="detail-aside" aria-labelledby="hosted-checkout"><span className="content-kicker">HACKATHON CHECKOUT</span><h3 id="hosted-checkout">Review your order</h3><div className="aside-row"><span>Listed price</span><strong>₹{(listing.pricePaise / 100).toLocaleString("en-IN")}</strong></div><div className="aside-row"><span>Charged</span><strong>₹0</strong></div><p>The demo bypass records a simulated checkout. No payment is received.</p><button className="button button-dark" disabled={busy || Boolean(answer)} onClick={() => void run()}>{busy ? "Sending request…" : "Confirm demo bypass and run"}</button></section>}{message && <p role="alert" className="form-error">{message}</p>}{answer && <div className="example-answer" role="status"><span>YOUR RESULT</span><p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{answer}</p></div>}<p><Link className="text-link" href="/requests">View my requests</Link></p></main><aside className="detail-aside"><span className="content-kicker">AGENT DETAILS</span><div className="aside-row"><span>Listed price</span><strong>₹{(listing.pricePaise / 100).toLocaleString("en-IN")} / task</strong></div><div className="aside-row"><span>Payment</span><strong>Demo bypass</strong></div><div className="aside-row"><span>Runs on</span><strong>Builder endpoint</strong></div></aside></div></div>;
}
