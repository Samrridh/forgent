import crypto from "node:crypto";
import { ForgentUserSession } from "@/lib/auth-session";

const SESSION_SECRET =
  process.env.AUTH_SECRET ||
  "forgent-hmac-sha256-verified-multi-tenant-session-secret-key-2026";

/**
 * Signs a session object into a tamper-evident session token:
 * payload_base64url.hmac_sha256_signature
 */
export function signSession(session: ForgentUserSession): string {
  const payloadStr = JSON.stringify(session);
  const payloadB64 = Buffer.from(payloadStr, "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies a session token string, checking HMAC signature and expiration.
 */
export function verifySession(token: string | null | undefined): ForgentUserSession | null {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");

  const sigBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const session = JSON.parse(jsonStr) as ForgentUserSession;

    // Check expiration
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}
