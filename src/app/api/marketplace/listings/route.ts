import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { MarketplaceListingInputSchema } from "@/server/forgent/marketplace-contracts";
import { resolveHostedEndpoint } from "@/server/forgent/hosted-task-agent";
import { rejectCrossOrigin } from "@/server/forgent/console-request";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const listings = await db.marketplaceListing.findMany({ where: { status: "PUBLISHED" }, select: { id: true, name: true, description: true, category: true, pricePaise: true, review: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ listings });
  } catch { return NextResponse.json({ error: "Marketplace storage is unavailable." }, { status: 503 }); }
}
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Demo publishing is disabled in production." }, { status: 503 });
  const denied = rejectCrossOrigin(request); if (denied) return denied;
  const parsed = MarketplaceListingInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide valid listing details, endpoint and schemas." }, { status: 400 });
  try { await resolveHostedEndpoint(parsed.data.endpointUrl); }
  catch { return NextResponse.json({ error: "Provide a publicly reachable HTTPS hostname without credentials or query parameters." }, { status: 400 }); }
  try {
    const listing = await db.marketplaceListing.create({ data: { ...parsed.data, builderId: "demo-builder", status: "PUBLISHED" }, select: { id: true, name: true, category: true, pricePaise: true } });
    return NextResponse.json({ listing }, { status: 201 });
  } catch { return NextResponse.json({ error: "Marketplace storage is unavailable. Check the database configuration and migrations." }, { status: 503 }); }
}
