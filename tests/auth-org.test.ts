import { describe, it, expect } from "vitest";
import {
  createPersonaSession,
  createEmailSession,
  DEMO_PERSONAS,
  ForgentUserSession,
} from "@/lib/auth-session";
import { signSession, verifySession } from "@/server/session";
import {
  GET as sessionGet,
  POST as sessionPost,
  DELETE as sessionDelete,
} from "@/app/api/auth/session/route";
import { NextRequest } from "next/server";

describe("Multi-Tenant Auth & Cryptographic Session Engine", () => {
  describe("Cryptographic Session Signing & Verification", () => {
    it("signs session with HMAC-SHA256 and verifies successfully", () => {
      const session = createPersonaSession("BUYER");
      const token = signSession(session);

      expect(typeof token).toBe("string");
      expect(token).toContain(".");

      const [payloadB64, signature] = token.split(".");
      expect(payloadB64.length).toBeGreaterThan(10);
      expect(signature.length).toBeGreaterThan(10);

      const verified = verifySession(token);
      expect(verified).not.toBeNull();
      expect(verified?.userId).toBe(session.userId);
      expect(verified?.role).toBe("BUYER");
      expect(verified?.name).toBe("Sarah Chen");
    });

    it("rejects tampered session payloads", () => {
      const session = createPersonaSession("BUYER");
      const token = signSession(session);
      const [, signature] = token.split(".");

      // Tampered payload trying to elevate privileges to ENTERPRISE_ADMIN
      const tamperedSession: ForgentUserSession = {
        ...session,
        role: "ENTERPRISE_ADMIN",
      };
      const tamperedPayloadB64 = Buffer.from(
        JSON.stringify(tamperedSession)
      ).toString("base64url");
      const tamperedToken = `${tamperedPayloadB64}.${signature}`;

      const verified = verifySession(tamperedToken);
      expect(verified).toBeNull();
    });

    it("rejects invalid or forged signatures", () => {
      const session = createPersonaSession("BUYER");
      const token = signSession(session);
      const [payloadB64] = token.split(".");

      const forgedToken = `${payloadB64}.forged_invalid_signature_hash`;
      const verified = verifySession(forgedToken);
      expect(verified).toBeNull();
    });

    it("rejects expired sessions", () => {
      const session: ForgentUserSession = {
        ...createPersonaSession("BUYER"),
        expiresAt: Date.now() - 1000, // expired 1s ago
      };

      const token = signSession(session);
      const verified = verifySession(token);
      expect(verified).toBeNull();
    });
  });

  describe("Demo Personas & Role Claims", () => {
    it("provides predefined BUYER persona: Sarah Chen (Northstar Logistics)", () => {
      const buyer = DEMO_PERSONAS.BUYER;
      expect(buyer.name).toBe("Sarah Chen");
      expect(buyer.role).toBe("BUYER");
      expect(buyer.activeOrganizationName).toBe("Northstar Logistics Enterprise");
      expect(buyer.organizations.some((o) => o.tier === "ENTERPRISE")).toBe(true);
      expect(buyer.organizations.some((o) => o.tier === "PERSONAL")).toBe(true);
    });

    it("provides predefined CREATOR persona: Alex Rivera (Autonomous FinTech Studio)", () => {
      const creator = DEMO_PERSONAS.CREATOR;
      expect(creator.name).toBe("Alex Rivera");
      expect(creator.role).toBe("CREATOR");
      expect(creator.activeOrganizationName).toBe("Autonomous FinTech Studio");
    });

    it("provides predefined ENTERPRISE_ADMIN persona: Marcus Vance (Apex Capital LLC)", () => {
      const admin = DEMO_PERSONAS.ENTERPRISE_ADMIN;
      expect(admin.name).toBe("Marcus Vance");
      expect(admin.role).toBe("ENTERPRISE_ADMIN");
      expect(admin.activeOrganizationName).toBe("Apex Capital LLC");
    });
  });

  describe("Multi-Tenant Organization Switching", () => {
    it("allows switching active workspace between Personal and Enterprise", () => {
      const session = createPersonaSession("BUYER");
      expect(session.activeOrganizationName).toBe("Northstar Logistics Enterprise");

      const personalOrg = session.organizations.find((o) => o.tier === "PERSONAL");
      expect(personalOrg).toBeDefined();

      const switched = createPersonaSession("BUYER", personalOrg?.id);
      expect(switched.activeOrganizationId).toBe(personalOrg?.id);
      expect(switched.activeOrganizationName).toBe("Personal Workspace");
    });

    it("supports magic link creation with corporate email and role claim", () => {
      const email = "jordan.lee@acmecorp.com";
      const session = createEmailSession(email, "ENTERPRISE_ADMIN");

      expect(session.email).toBe(email);
      expect(session.role).toBe("ENTERPRISE_ADMIN");
      expect(session.organizations.length).toBeGreaterThanOrEqual(2);
      expect(session.organizations.some((o) => o.tier === "PERSONAL")).toBe(true);
    });
  });

  describe("Auth API Session Route (/api/auth/session)", () => {
    it("returns active session or default BUYER on GET", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/session");
      const res = await sessionGet(req);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.session).toBeDefined();
      expect(data.session.role).toBe("BUYER");
    });

    it("switches persona and issues signed forgent_session cookie on POST switch_persona", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "switch_persona",
          role: "CREATOR",
        }),
      });

      const res = await sessionPost(req);
      expect(res.status).toBe(200);

      const cookieHeader = res.headers.get("set-cookie");
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain("forgent_session=");

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.session.role).toBe("CREATOR");
      expect(data.session.name).toBe("Alex Rivera");
    });

    it("authenticates via Magic Link on POST magic_link", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "magic_link",
          email: "elena.rostova@quantumcapital.com",
          role: "BUYER",
        }),
      });

      const res = await sessionPost(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.session.email).toBe("elena.rostova@quantumcapital.com");
      expect(data.session.role).toBe("BUYER");
      expect(data.session.name).toBe("Elena Rostova");
    });

    it("authenticates via OAuth on POST oauth", async () => {
      const req = new NextRequest("http://localhost:3000/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "oauth",
          provider: "github",
        }),
      });

      const res = await sessionPost(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.session.role).toBe("CREATOR");
      expect(data.session.name).toBe("Demo GitHub User");
    });

    it("clears session cookie on DELETE", async () => {
      const res = await sessionDelete();
      expect(res.status).toBe(200);

      const cookieHeader = res.headers.get("set-cookie");
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader).toContain("forgent_session=;");
      expect(cookieHeader).toContain("Max-Age=0");
    });
  });
});
