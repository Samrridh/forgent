import {
  RedactedFieldRecord,
  RedactionCategory,
} from "@/lib/contracts/gateway-types";

export interface SanitizationResult {
  sanitized: unknown;
  redactedKeys: string[];
  redactedDetails: RedactedFieldRecord[];
  hasModifications: boolean;
  secretsCount: number;
  piiCount: number;
}

interface PatternMatcher {
  type: string;
  category: RedactionCategory;
  replacement: string;
  regex: RegExp;
}

// Secret and PII Regular Expressions
const PATTERN_MATCHERS: PatternMatcher[] = [
  // 1. OpenAI / Anthropic / Stripe Secret Keys
  {
    type: "api_key_sk",
    category: "SECRET",
    replacement: "[REDACTED_SECRET]",
    regex: /\bsk-(?:proj-|ant-|live-|test-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    type: "stripe_secret_key",
    category: "SECRET",
    replacement: "[REDACTED_SECRET]",
    regex: /\bsk_(?:live|test)_[0-9a-zA-Z]{24,}\b/g,
  },
  // 2. Google Cloud / AIza API Keys
  {
    type: "google_api_key",
    category: "SECRET",
    replacement: "[REDACTED_SECRET]",
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
  },
  // 3. AWS Access Key IDs
  {
    type: "aws_access_key",
    category: "SECRET",
    replacement: "[REDACTED_SECRET]",
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
  },
  // 4. GitHub Personal Access & OAuth Tokens
  {
    type: "github_token",
    category: "SECRET",
    replacement: "[REDACTED_SECRET]",
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36}\b|\bgithub_pat_[a-zA-Z0-9_]{22}_[a-zA-Z0-9_]{59}\b/g,
  },
  // 5. JSON Web Tokens (JWT)
  {
    type: "jwt_token",
    category: "SECRET",
    replacement: "[REDACTED_SECRET]",
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
  },
  // 6. Private Key Headers
  {
    type: "private_key_pem",
    category: "SECRET",
    replacement: "[REDACTED_SECRET]",
    regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/g,
  },
  // 7. Credit Card Numbers (13-16 digits formatted or continuous)
  {
    type: "credit_card",
    category: "PII",
    replacement: "[REDACTED_PII]",
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b|\b(?:\d{4}[ -]){3}\d{4}\b/g,
  },
  // 8. Email Addresses
  {
    type: "email_address",
    category: "PII",
    replacement: "[REDACTED_PII]",
    regex: /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
  },
  // 9. Social Security Numbers (SSN)
  {
    type: "social_security_number",
    category: "PII",
    replacement: "[REDACTED_PII]",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  // 10. Phone Numbers (US / E.164 formats)
  {
    type: "phone_number",
    category: "PII",
    replacement: "[REDACTED_PII]",
    regex: /\b(?:\+?1[-. ]?)?\(?[0-9]{3}\)?[-. ]?[0-9]{3}[-. ]?[0-9]{4}\b/g,
  },
];

// Sensitive key identifiers for object property masking
const SENSITIVE_KEY_REGEX = /^(?:password|passwd|passphrase|secret|client_secret|api_key|apikey|auth_token|access_token|private_key|token|authorization)$/i;

/**
 * Scans and redacts sensitive tokens inside a single string.
 */
export function sanitizeString(
  input: string,
  path: string,
  details: RedactedFieldRecord[]
): { result: string; modified: boolean } {
  let modified = false;
  let current = input;

  // Direct string patterns
  for (const matcher of PATTERN_MATCHERS) {
    if (matcher.regex.test(current)) {
      current = current.replace(matcher.regex, () => {
        modified = true;
        details.push({
          path,
          patternType: matcher.type,
          category: matcher.category,
          replacement: matcher.replacement,
        });
        return matcher.replacement;
      });
    }
    matcher.regex.lastIndex = 0;
  }

  // String inline assignment detection like "password: mySecretPassword123"
  const inlineSecretRegex = /(?:password|passwd|secret|api_key|client_secret)\s*[:=]\s*["']?([^"',;\s]+)["']?/gi;
  if (inlineSecretRegex.test(current)) {
    current = current.replace(inlineSecretRegex, (fullMatch, secretVal) => {
      if (secretVal === "[REDACTED_SECRET]") return fullMatch;
      modified = true;
      details.push({
        path,
        patternType: "inline_secret_assignment",
        category: "SECRET",
        replacement: "[REDACTED_SECRET]",
      });
      return fullMatch.replace(secretVal, "[REDACTED_SECRET]");
    });
  }

  return { result: current, modified };
}

/**
 * Recursively sanitizes any JSON structure (objects, arrays, strings, primitives).
 */
export function sanitizePayload(
  payload: unknown,
  enablePii: boolean = true
): SanitizationResult {
  const redactedKeysSet = new Set<string>();
  const redactedDetails: RedactedFieldRecord[] = [];
  const seenObjects = new WeakSet<object>();

  function traverse(node: unknown, path: string): unknown {
    if (node === null || node === undefined) {
      return node;
    }

    if (typeof node === "string") {
      const { result, modified } = sanitizeString(node, path, redactedDetails);
      if (modified) {
        redactedKeysSet.add(path || "root");
      }
      return result;
    }

    if (typeof node === "number" || typeof node === "boolean") {
      return node;
    }

    if (Array.isArray(node)) {
      return node.map((item, index) =>
        traverse(item, path ? `${path}[${index}]` : `[${index}]`)
      );
    }

    if (typeof node === "object") {
      if (seenObjects.has(node)) {
        return "[CIRCULAR_REFERENCE]";
      }
      seenObjects.add(node);

      const record = node as Record<string, unknown>;
      const sanitizedRecord: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(record)) {
        const currentPath = path ? `${path}.${key}` : key;

        // Key-name based redaction (e.g. key is "password", "api_key", "secret")
        if (SENSITIVE_KEY_REGEX.test(key) && value !== null && value !== undefined) {
          sanitizedRecord[key] = "[REDACTED_SECRET]";
          redactedKeysSet.add(currentPath);
          redactedDetails.push({
            path: currentPath,
            patternType: "sensitive_key_name",
            category: "SECRET",
            replacement: "[REDACTED_SECRET]",
          });
          continue;
        }

        sanitizedRecord[key] = traverse(value, currentPath);
      }

      return sanitizedRecord;
    }

    return node;
  }

  const sanitized = traverse(payload, "");

  // If PII masking is disabled by policy, filter out PII details (though by default it is enabled)
  const filteredDetails = enablePii
    ? redactedDetails
    : redactedDetails.filter((d) => d.category !== "PII");

  const secretsCount = filteredDetails.filter((d) => d.category === "SECRET").length;
  const piiCount = filteredDetails.filter((d) => d.category === "PII").length;

  return {
    sanitized,
    redactedKeys: Array.from(redactedKeysSet),
    redactedDetails: filteredDetails,
    hasModifications: redactedKeysSet.size > 0,
    secretsCount,
    piiCount,
  };
}
