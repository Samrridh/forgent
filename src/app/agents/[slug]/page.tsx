import { notFound } from "next/navigation";
import { AgentDetail } from "@/components/forgent/agent-detail";
import { PublishedAgentDetail } from "@/components/forgent/published-agent-detail";
import { DemoListingDetail } from "@/components/forgent/demo-listing-detail";
import { MarketplaceListingDetail } from "@/components/forgent/marketplace-listing-detail";
import { ExampleAgentDetail } from "@/components/forgent/example-agent-detail";
import { exampleAgents } from "@/data/example-agents";
import { withDemoStore } from "@/server/forgent/demo-store";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";
export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug.startsWith("live-")) {
    let listing;
    try {
      listing = await db.marketplaceListing.findFirst({ where: { id: slug.slice(5), status: "PUBLISHED" }, select: { id: true, name: true, description: true, category: true, pricePaise: true } });
    } catch {
      return <div className="page-width inner-page"><h1>Agent unavailable</h1><p>Marketplace storage is unavailable. Please try again later.</p></div>;
    }
    if (!listing) notFound();
    return <MarketplaceListingDetail listing={listing} />;
  }
  if (slug.startsWith("demo-")) {
    const listing = await withDemoStore((store) => store.demoListings?.find((item) => item.id === slug.slice(5)));
    if (!listing) notFound();
    return <DemoListingDetail listing={listing} />;
  }
  if (slug === "knowledge-support") return <AgentDetail />;
  const example = exampleAgents.find((item) => item.id === slug);
  if (example) return <ExampleAgentDetail agent={example} />;
  const agent = await withDemoStore((store) => store.agents.find((item) => item.id === slug && item.status === "published"));
  if (!agent) notFound();
  return <PublishedAgentDetail agent={{ id: agent.id, name: agent.name, description: agent.description, priceMicros: agent.priceMicros, report: agent.report }} />;
}
