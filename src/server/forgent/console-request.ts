import { NextRequest, NextResponse } from "next/server";
export function rejectCrossOrigin(request:NextRequest):NextResponse | null {
  const origin=request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host");
    let sameOrigin = false;
    try {
      const parsed = new URL(origin);
      sameOrigin = host ? parsed.host === host && parsed.protocol === request.nextUrl.protocol && parsed.origin === origin : origin === request.nextUrl.origin;
    } catch {
      sameOrigin = false;
    }
    if (!sameOrigin) return NextResponse.json({error:"Cross-origin requests are not permitted."},{status:403});
  }
  return null;
}
