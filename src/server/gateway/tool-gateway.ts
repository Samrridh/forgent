import {
  GatewayAuditRecord,
  GatewayPolicyConfig,
  InterceptResult,
  ToolInvocationRequest,
  ToolInvocationRequestSchema,
} from "@/lib/contracts/gateway-types";
import { sanitizePayload, SanitizationResult } from "./data-sanitizer";
import { gatewayStore } from "./gateway-store";

// Operations that represent consequential state modifications
const STATE_MUTATION_REGEX =
  /^(?:commit|mutate|write|delete|update|drop|truncate|alter|insert|transfer):/i;

// Operations that represent network egress
const NETWORK_EGRESS_REGEX =
  /^(?:network:egress|http:request|webhook:send|fetch:external|socket:connect)/i;

export class ToolGateway {
  /**
   * Intercepts, authorizes, and sanitizes an agent tool invocation.
   */
  public async interceptToolCall(
    rawRequest: ToolInvocationRequest
  ): Promise<InterceptResult> {
    const startTime = performance.now();
    const validatedRequest = ToolInvocationRequestSchema.parse(rawRequest);

    const {
      callerAgentId,
      toolName,
      operation,
      payload,
      declaredCapabilities,
      targetUrl,
      configOverride,
    } = validatedRequest;

    const basePolicy = gatewayStore.getPolicy();
    const config: GatewayPolicyConfig = {
      ...basePolicy,
      ...configOverride,
    };

    let blockedReason: string | undefined;
    let scopeAuthorized = true;
    let stateMutationLocked = false;
    let egressContained = true;

    // 1. Check prohibited dangerous operations
    const isProhibitedOperation = config.blockedOperations.some(
      (blocked) => blocked.toLowerCase() === operation.toLowerCase()
    );

    if (isProhibitedOperation) {
      scopeAuthorized = false;
      blockedReason = `Operation '${operation}' is prohibited by enterprise tool gateway policy.`;
    }

    // 2. Check Declared Agent Capabilities (Scope Authorization)
    if (
      !blockedReason &&
      declaredCapabilities &&
      declaredCapabilities.length > 0
    ) {
      const hasMatchingCapability = declaredCapabilities.some((cap) => {
        if (cap === "*" || cap === "admin:all") return true;
        if (cap.toLowerCase() === operation.toLowerCase()) return true;
        // Prefix wildcard capability support, e.g. "read:*" matching "read:analytics"
        if (cap.endsWith(":*")) {
          const prefix = cap.slice(0, -1).toLowerCase();
          return operation.toLowerCase().startsWith(prefix);
        }
        return false;
      });

      if (!hasMatchingCapability) {
        scopeAuthorized = false;
        blockedReason = `Scope authorization violation: Agent '${callerAgentId}' lacks capability for operation '${operation}'. Declared capabilities: [${declaredCapabilities.join(
          ", "
        )}].`;
      }
    }

    // 3. Check Consequential State Mutation Lock
    if (
      !blockedReason &&
      config.consequentialStateMutationLock &&
      STATE_MUTATION_REGEX.test(operation)
    ) {
      const isDualAuthorized =
        declaredCapabilities &&
        declaredCapabilities.some(
          (cap) =>
            cap.toLowerCase() === `dual_auth:${operation.toLowerCase()}` ||
            cap.toLowerCase() === "admin:dual_auth"
        );

      if (!isDualAuthorized) {
        stateMutationLocked = true;
        scopeAuthorized = false;
        blockedReason = `Consequential state mutation locked by enterprise security policy (operation: ${operation}). Requires dual-authorization signature.`;
      }
    }

    // 4. Check Network Egress Containment
    if (!blockedReason && config.networkEgressContainment) {
      const isEgressOp =
        NETWORK_EGRESS_REGEX.test(operation) || Boolean(targetUrl);

      if (isEgressOp && targetUrl) {
        try {
          const parsedUrl = new URL(targetUrl);
          const isAllowedDomain = config.allowedEgressDomains.some((domain) => {
            if (domain.startsWith("*.")) {
              const root = domain.slice(2);
              return (
                parsedUrl.hostname === root ||
                parsedUrl.hostname.endsWith(`.${root}`)
              );
            }
            return parsedUrl.hostname.toLowerCase() === domain.toLowerCase();
          });

          if (!isAllowedDomain) {
            egressContained = false;
            scopeAuthorized = false;
            blockedReason = `Network egress containment active. Destination URL '${targetUrl}' is not in approved enterprise boundary.`;
          }
        } catch {
          egressContained = false;
          scopeAuthorized = false;
          blockedReason = `Invalid destination URL format for network egress: '${targetUrl}'.`;
        }
      }
    }

    // 5. Data Masking & Secret Redaction
    let sanitization: SanitizationResult;
    if (config.zeroTrustPiiMasking) {
      sanitization = sanitizePayload(payload, true);
    } else {
      sanitization = {
        sanitized: payload,
        redactedKeys: [],
        redactedDetails: [],
        hasModifications: false,
        secretsCount: 0,
        piiCount: 0,
      };
    }

    const executionLatencyMs = Math.max(
      1,
      Math.round(performance.now() - startTime)
    );

    // Determine verdict
    let verdict: "ALLOWED" | "REDACTED" | "BLOCKED";
    if (blockedReason) {
      verdict = "BLOCKED";
    } else if (sanitization.hasModifications) {
      verdict = "REDACTED";
    } else {
      verdict = "ALLOWED";
    }

    const payloadPreview =
      typeof payload === "string"
        ? payload.slice(0, 150)
        : JSON.stringify(payload).slice(0, 150);

    const sanitizedPreview =
      typeof sanitization.sanitized === "string"
        ? sanitization.sanitized.slice(0, 150)
        : JSON.stringify(sanitization.sanitized).slice(0, 150);

    // 6. Structured Audit Record Creation
    const auditRecord: GatewayAuditRecord = {
      id: `gw-audit-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      callerAgentId,
      toolName,
      operation,
      verdict,
      blockedReason,
      redactedKeys: sanitization.redactedKeys,
      redactedDetails: sanitization.redactedDetails,
      originalPayloadPreview: payloadPreview,
      sanitizedPayloadPreview: sanitizedPreview,
      sanitizedPayload: sanitization.sanitized,
      policyEvaluations: {
        piiMasked: sanitization.piiCount > 0,
        secretsRedacted: sanitization.secretsCount > 0,
        scopeAuthorized,
        egressContained,
        stateMutationLocked,
      },
      executionLatencyMs,
    };

    // Store audit record
    gatewayStore.addAuditRecord(auditRecord);

    return {
      success: verdict !== "BLOCKED",
      verdict,
      sanitizedPayload: sanitization.sanitized,
      redactedKeys: sanitization.redactedKeys,
      redactedCount: sanitization.redactedDetails.length,
      blockedReason,
      auditRecord,
    };
  }
}

export const toolGateway = new ToolGateway();
export default toolGateway;
