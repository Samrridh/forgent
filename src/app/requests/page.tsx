"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
type Order = { id: string; task: string; status: string; paymentStatus: string; result: { text?: string } | null; createdAt: string; listing: { name: string } };
export default function RequestsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/marketplace/orders").then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load requests."); setOrders(data.orders); }).catch(err => setError(err instanceof Error ? err.message : "Could not load requests.")).finally(() => setLoading(false)); }, []);
  return <div className="page-width inner-page"><span className="content-kicker">HACKATHON DEMO</span><h1>My requests</h1><p>These requests belong to a shared demo persona. Do not use private information. All checkout bypasses are simulated.</p>{loading && <p>Loading requests…</p>}{error && <p role="alert">{error}</p>}{!loading && !error && !orders.length && <p>No requests yet. <Link href="/agents">Explore agents</Link>.</p>}{orders.map(order => <article className="business-candidate" key={order.id}><h2>{order.listing.name}</h2><p>{order.task}</p><p>Status: {order.status} · Payment: demo bypass</p>{order.result?.text && <p style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{order.result.text}</p>}</article>)}</div>;
}
