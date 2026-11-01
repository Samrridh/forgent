import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { MarketplaceOrderInputSchema } from "@/server/forgent/marketplace-contracts";
import { invokeHostedTask } from "@/server/forgent/hosted-task-agent";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
import { isLocalMarketplace } from "@/server/forgent/local-marketplace";
import { listLocalOrders, runLocalOrder } from "@/server/forgent/local-marketplace-orders";

export const dynamic = "force-dynamic";
export async function GET() {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Demo orders are disabled in production." }, { status: 503 });
  try {
    if (isLocalMarketplace()) return NextResponse.json({ orders: await listLocalOrders() });
    const orders = await db.marketplaceOrder.findMany({ where: { buyerId: "demo-individual" }, include: { listing: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ orders });
  } catch { return NextResponse.json({ error: "Marketplace storage is unavailable." }, { status: 503 }); }
}
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Demo checkout is disabled in production." }, { status: 503 });
  const denied = rejectCrossOrigin(request); if (denied) return denied;
  const parsed = MarketplaceOrderInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid task and confirm demo bypass." }, { status: 400 });
  const { listingId, requestId, task } = parsed.data;
  const buyerId = "demo-individual";
  try {
    if (isLocalMarketplace()) return await runLocalOrder(parsed.data);
    const listing = await db.marketplaceListing.findFirst({ where: { id: listingId, status: "PUBLISHED" } });
    if (!listing) return NextResponse.json({ error: "Agent not found." }, { status: 404 });
    let order;
    try {
      order = await db.marketplaceOrder.create({ data: { listingId, buyerId, requestId, task, pricePaise: listing.pricePaise, paymentStatus: "DEMO_BYPASSED", status: "RUNNING" } });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
      const existing = await db.marketplaceOrder.findUnique({ where: { buyerId_requestId: { buyerId, requestId } } });
      if (!existing || existing.listingId !== listingId || existing.task !== task) return NextResponse.json({ error: "This request ID was already used for a different task." }, { status: 409 });
      return NextResponse.json({ order: existing });
    }
    let result: string;
    try {
      result = await invokeHostedTask(listing.endpointUrl, task);
    } catch {
      const uncertain = await db.marketplaceOrder.update({ where: { id: order.id }, data: { status: "UNKNOWN", errorCode: "AGENT_UNAVAILABLE" } });
      return NextResponse.json({ order: uncertain, error: "The agent did not return a usable response. Its completion is unknown; check with the builder before submitting again. No payment was taken." }, { status: 502 });
    }
    const completed = await db.marketplaceOrder.update({ where: { id: order.id }, data: { status: "COMPLETED", result: { text: result } } });
    return NextResponse.json({ order: completed }, { status: 201 });
  } catch { return NextResponse.json({ error: "Marketplace storage is unavailable. Check the database configuration and migrations." }, { status: 503 }); }
}
