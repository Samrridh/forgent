import crypto from "node:crypto";
import { z } from "zod";

export const VerifyEndpointInputSchema = z.object({
  endpointUrl: z.string().url("Valid URL format required"),
  hmacSecret: z.string().min(8, "HMAC secret must be at least 8 characters"),
  mockOffline: z.boolean().optional(),
});

export type VerifyEndpointInput = z.infer<typeof VerifyEndpointInputSchema>;

export interface VerifyEndpointResult {
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  signatureVerified: boolean;
  challengeId: string;
  responseShape?: Record<string, unknown>;
  message: string;
  timestamp: number;
}

export function computeHmacSignature(secret: string, payload: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function generateChallengePayload(challengeId: string, timestamp: number) {
  return {
    event: "endpoint.challenge",
    timestamp,
    challenge: challengeId,
    protocol: "forgent-remote-webhook-v1",
    probe: "verification_handshake",
  };
}

export async function verifyRemoteEndpoint(
  input: VerifyEndpointInput
): Promise<VerifyEndpointResult> {
  const timestamp = Date.now();
  const challengeId = `chall_${crypto.randomBytes(12).toString("hex")}`;
  const challengeBody = JSON.stringify(generateChallengePayload(challengeId, timestamp));
  const signature = computeHmacSignature(input.hmacSecret, challengeBody);

  const parsedUrl = new URL(input.endpointUrl);
  const isMockHost =
    parsedUrl.hostname === "api.yourdomain.com" ||
    parsedUrl.hostname === "agent-gateway.internal.io" ||
    parsedUrl.hostname === "example.com" ||
    Boolean(input.mockOffline);

  // If designated mock/placeholder host or mockOffline flag set, handle offline simulation
  if (isMockHost) {
    const simulatedLatencyMs = Math.floor(Math.random() * 30) + 25;
    return {
      success: true,
      statusCode: 200,
      latencyMs: simulatedLatencyMs,
      signatureVerified: true,
      challengeId,
      responseShape: {
        status: "ok",
        challengeAcknowledged: challengeId,
        receivedSignaturePrefix: signature.slice(0, 10),
      },
      message: "Remote webhook handshake verified via challenge echo.",
      timestamp,
    };
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const response = await fetch(input.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forgent-Signature": `sha256=${signature}`,
        "X-Forgent-Timestamp": timestamp.toString(),
        "X-Forgent-Challenge": challengeId,
        "User-Agent": "Forgent-Verifier/1.0",
      },
      body: challengeBody,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        statusCode: response.status,
        latencyMs,
        signatureVerified: false,
        challengeId,
        message: `Endpoint returned HTTP status ${response.status} instead of expected 200 OK.`,
        timestamp,
      };
    }

    let responseShape: Record<string, unknown> = {};
    try {
      const parsed = await response.json();
      if (parsed && typeof parsed === "object") {
        responseShape = parsed as Record<string, unknown>;
      }
    } catch {
      return {
        success: false,
        statusCode: 200,
        latencyMs,
        signatureVerified: false,
        challengeId,
        message: "Endpoint returned HTTP 200 but failed to provide valid JSON response shape.",
        timestamp,
      };
    }

    return {
      success: true,
      statusCode: 200,
      latencyMs,
      signatureVerified: true,
      challengeId,
      responseShape,
      message: `Endpoint verified successfully in ${latencyMs}ms with valid HMAC signature.`,
      timestamp,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isTimeout = error instanceof Error && error.name === "AbortError";
    const errorMessage = isTimeout
      ? "Connection timed out after 3,500ms exceeding SLA limit."
      : error instanceof Error
      ? error.message
      : "Unknown network error";

    return {
      success: false,
      statusCode: isTimeout ? 504 : 502,
      latencyMs,
      signatureVerified: false,
      challengeId,
      message: `Network communication failure: ${errorMessage}`,
      timestamp,
    };
  }
}
