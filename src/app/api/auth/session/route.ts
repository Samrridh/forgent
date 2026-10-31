import { NextRequest, NextResponse } from "next/server";
import {
  createPersonaSession,
  createEmailSession,
  UserRole,
  ForgentUserSession,
} from "@/lib/auth-session";
import { signSession, verifySession } from "@/server/session";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "forgent_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function GET(req: NextRequest) {
  const cookieVal = req.cookies.get(COOKIE_NAME)?.value;
  const verified = verifySession(cookieVal);

  if (verified) {
    return NextResponse.json({
      authenticated: true,
      session: verified,
    });
  }

  // Fallback to default BUYER persona (Sarah Chen) for frictionless demo exploration
  const defaultSession = createPersonaSession("BUYER");
  return NextResponse.json({
    authenticated: false,
    session: defaultSession,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "switch_persona";
    let session: ForgentUserSession;

    if (action === "switch_persona") {
      const targetRole = (body.role as UserRole) || "BUYER";
      session = createPersonaSession(targetRole);
    } else if (action === "magic_link") {
      const email = body.email;
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return NextResponse.json(
          { error: "Valid email address is required" },
          { status: 400 }
        );
      }
      const role = (body.role as UserRole) || "BUYER";
      session = createEmailSession(email, role);
    } else if (action === "oauth") {
      const provider = body.provider || "google";
      const name = provider === "google" ? "Demo Google User" : "Demo GitHub User";
      const email =
        provider === "google"
          ? "google.user@forgent.demo"
          : "github.developer@forgent.demo";
      const role: UserRole = provider === "github" ? "CREATOR" : "BUYER";
      session = createEmailSession(email, role, name);
    } else if (action === "switch_org") {
      const targetOrgId = body.organizationId;
      const currentCookie = req.cookies.get(COOKIE_NAME)?.value;
      const existing = verifySession(currentCookie) || createPersonaSession("BUYER");

      const targetOrg = existing.organizations.find((o) => o.id === targetOrgId);
      if (!targetOrg) {
        return NextResponse.json(
          { error: "Organization membership not found" },
          { status: 404 }
        );
      }

      session = {
        ...existing,
        activeOrganizationId: targetOrg.id,
        activeOrganizationName: targetOrg.name,
      };
    } else {
      session = createPersonaSession("BUYER");
    }

    const token = signSession(session);
    const response = NextResponse.json({
      success: true,
      session,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to process auth session";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: "Session terminated successfully",
  });

  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
