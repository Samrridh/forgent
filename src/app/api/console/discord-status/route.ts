import { NextResponse } from "next/server";
import { withDemoStore } from "@/server/forgent/demo-store";
export const dynamic="force-dynamic";
export async function GET(){const status=await withDemoStore(store=>store.discordStatus||null);return NextResponse.json({status,connected:!!status&&Date.now()-Date.parse(status.lastSeenAt)<45000});}
