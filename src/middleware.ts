import { NextRequest, NextResponse } from "next/server";
const retired = ["/enterprise/policies", "/buyer", "/builder", "/creator", "/jobs", "/playground", "/leaderboard", "/templates", "/solutions", "/verify", "/disputes", "/settings", "/login", "/dev"];
export function middleware(request: NextRequest) { const path=request.nextUrl.pathname; if(retired.some(prefix=>path===prefix||path.startsWith(prefix+"/"))) { const url=request.nextUrl.clone();url.pathname=path.startsWith("/builder")||path.startsWith("/creator")?"/publish":"/agents";url.search="";return NextResponse.redirect(url); }return NextResponse.next(); }
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
