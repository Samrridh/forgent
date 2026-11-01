"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, UploadCloud } from "lucide-react";

interface BuilderListing { id: string; name: string; description: string; category: string; pricePaise: number }

export function BuilderListings({ onSubmit }: { onSubmit: () => void }) {
  const [listings, setListings] = useState<BuilderListing[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/marketplace/listings", { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("Could not load marketplace listings. Please try again.");
      const data = await response.json() as { listings: BuilderListing[] };
      setListings(data.listings);
    }).catch((err: unknown) => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load marketplace listings."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <section className="hosted-agents"><div className="agents-tab-heading"><div><span className="content-kicker">YOUR AGENTS</span><h2>Manage your listings.</h2><p>Published hosted agents in the shared demo marketplace.</p></div><span>{listings.length} {listings.length === 1 ? "AGENT" : "AGENTS"}</span></div>
    {loading && <p role="status">Loading listings…</p>}{error && <p className="form-error" role="alert">{error}</p>}
    {!loading && !error && listings.length === 0 && <div className="empty-state"><UploadCloud size={22}/><strong>No listings yet</strong><p>Describe your first agent to create a listing.</p><button className="text-link" onClick={onSubmit}>Submit an agent <ArrowRight size={14}/></button></div>}
    {listings.map((agent) => <article className="submission-form hosted-agent" key={agent.id}><span className="content-kicker">PUBLISHED · {agent.category}</span><h3>{agent.name}</h3><p>{agent.description}</p><p>Listed price: ₹{(agent.pricePaise / 100).toLocaleString("en-IN")} per task · demo checkout</p><Link className="text-link" href={`/agents/live-${agent.id}`}>View listing <ArrowRight size={14}/></Link></article>)}
  </section>;
}
