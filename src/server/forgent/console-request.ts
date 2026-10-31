import { NextRequest, NextResponse } from "next/server";
export function rejectCrossOrigin(request:NextRequest):NextResponse | null {
  const origin=request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({error:"Cross-origin requests are not permitted."},{status:403});
  return null;
}
