import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { invokeHostedTask } from "./hosted-task-agent";
import { withLocalMarketplace } from "./local-marketplace";
import { MarketplaceOrderInputSchema } from "./marketplace-contracts";
import { z } from "zod";

type Input = z.infer<typeof MarketplaceOrderInputSchema>;
export async function listLocalOrders() {
 return withLocalMarketplace(store => store.orders.slice(0, 100).map(order => ({ ...order, listing: { name: store.listings.find(item => item.id === order.listingId)?.details.name || "Agent" } })));
}
export async function runLocalOrder(input: Input) {
 const prepared = await withLocalMarketplace(store => {
  const listing = store.listings.find(item => item.id === input.listingId);
  if (!listing) return { kind: "not-found" as const };
  const existing = store.orders.find(order => order.requestId === input.requestId);
  if (existing) return existing.listingId !== input.listingId || existing.task !== input.task ? { kind: "conflict" as const } : { kind: "existing" as const, order: existing };
  const order = { id: randomUUID(), listingId: listing.id, requestId: input.requestId, task: input.task, pricePaise: listing.details.pricePaise, status: "RUNNING" as const, result: null, errorCode: null, createdAt: new Date().toISOString() };
  store.orders.unshift(order);
  return { kind: "created" as const, order, endpoint: listing.details.endpointUrl };
 }, true);
 if (prepared.kind === "not-found") return NextResponse.json({ error: "Agent not found." }, { status: 404 });
 if (prepared.kind === "conflict") return NextResponse.json({ error: "This request ID was already used for a different task." }, { status: 409 });
 if (prepared.kind === "existing") return NextResponse.json({ order: prepared.order });
 let text: string;
 try {
  text = await invokeHostedTask(prepared.endpoint, input.task);
 } catch {
  const order = await withLocalMarketplace(store => { const item = store.orders.find(o => o.id === prepared.order.id)!; item.status = "UNKNOWN"; item.errorCode = "AGENT_UNAVAILABLE"; return item; }, true);
  return NextResponse.json({ order, error: "The agent did not return a usable response. Its completion is unknown; check with the builder before submitting again. No payment was taken." }, { status: 502 });
 }
 const order = await withLocalMarketplace(store => { const item = store.orders.find(o => o.id === prepared.order.id)!; item.status = "COMPLETED"; item.result = { text }; return item; }, true);
 return NextResponse.json({ order }, { status: 201 });
}
