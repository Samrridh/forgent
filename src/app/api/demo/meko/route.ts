import { NextResponse } from "next/server";
import { runMekoDemo } from "@/server/forgent/meko-handoff";

export const dynamic = "force-dynamic";
export async function POST() {
  try { return NextResponse.json(await runMekoDemo()); }
  catch (error) {
    const message = error instanceof Error && (error.message.startsWith("Set MEKO_") || error.message.startsWith("Meko could") || error.message.startsWith("The support model")) ? error.message : "The demo service could not be reached or returned an invalid response.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
