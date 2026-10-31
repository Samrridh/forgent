import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { DemoListingInputSchema } from "@/server/forgent/demo-listing-contract";
import { withDemoStore } from "@/server/forgent/demo-store";
import { rejectCrossOrigin } from "@/server/forgent/console-request";

export const dynamic = "force-dynamic";
export async function GET() {
  const listings = await withDemoStore((store) => store.demoListings || []);
  return NextResponse.json({ listings });
}
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Demo publishing is unavailable in production." }, { status: 503 });
  const denied = rejectCrossOrigin(request); if (denied) return denied;
  const parsed = DemoListingInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide valid listing details and a static review." }, { status: 400 });
  const listing = { ...parsed.data, id: randomUUID(), createdAt: new Date().toISOString() };
  await withDemoStore((store) => { (store.demoListings ||= []).unshift(listing); }, true);
  return NextResponse.json({ listing }, { status: 201 });
}
