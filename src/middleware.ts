import { NextResponse } from "next/server";

// Existing application routes are available for demo navigation.
export function middleware() {
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
