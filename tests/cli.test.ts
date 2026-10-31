import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { POST as uploadPackageRoute } from "@/app/api/builder/packages/upload/route";

const CLI_PATH = path.resolve(__dirname, "../bin/forgent");
const TMP_TEST_DIR = path.resolve(__dirname, "../tmp-cli-test");

describe("Forgent Developer CLI Suite (bin/forgent)", () => {
  beforeAll(() => {
    if (fs.existsSync(TMP_TEST_DIR)) {
      fs.rmSync(TMP_TEST_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TMP_TEST_DIR, { recursive: true });
  });

  afterAll(() => {
    if (fs.existsSync(TMP_TEST_DIR)) {
      fs.rmSync(TMP_TEST_DIR, { recursive: true, force: true });
    }
  });

  it("prints CLI usage with --help and version with --version", () => {
    const helpOutput = execSync(`node "${CLI_PATH}" --help`, { encoding: "utf8" });
    expect(helpOutput).toContain("Forgent Developer CLI");
    expect(helpOutput).toContain("forgent init");
    expect(helpOutput).toContain("forgent test");
    expect(helpOutput).toContain("forgent publish");

    const versionOutput = execSync(`node "${CLI_PATH}" --version`, { encoding: "utf8" });
    expect(versionOutput.trim()).toBe("forgent v0.1.0");
  });

  it("scaffolds a new agent directory with forgent init", () => {
    const agentName = "Ledger Audit Sentinel";
    const expectedSlug = "ledger-audit-sentinel";
    const agentDir = path.join(TMP_TEST_DIR, expectedSlug);

    const output = execSync(
      `node "${CLI_PATH}" init "${agentName}" --template finance`,
      { cwd: TMP_TEST_DIR, encoding: "utf8" }
    );

    expect(output).toContain(`[FORGENT] Initialized new agent package in ./${expectedSlug}`);
    expect(fs.existsSync(agentDir)).toBe(true);

    const manifestPath = path.join(agentDir, "manifest.json");
    const agentPath = path.join(agentDir, "agent.ts");
    const testPath = path.join(agentDir, "agent.test.ts");
    const readmePath = path.join(agentDir, "README.md");

    expect(fs.existsSync(manifestPath)).toBe(true);
    expect(fs.existsSync(agentPath)).toBe(true);
    expect(fs.existsSync(testPath)).toBe(true);
    expect(fs.existsSync(readmePath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(manifest.name).toBe(agentName);
    expect(manifest.slug).toBe(expectedSlug);
    expect(manifest.category).toBe("Finance");
    expect(manifest.pricing.pricePerTaskUsd).toBe(2.50);
    expect(manifest.inputSchema).toBeDefined();
    expect(manifest.outputSchema).toBeDefined();
  });

  it("executes local qualification checks with forgent test", () => {
    const agentDir = path.join(TMP_TEST_DIR, "ledger-audit-sentinel");
    const output = execSync(
      `node "${CLI_PATH}" test --dir "${agentDir}"`,
      { encoding: "utf8" }
    );

    expect(output).toContain("[PASS] Stage 1 (Schema Contract)");
    expect(output).toContain("[PASS] Stage 2 (Adversarial Defense)");
    expect(output).toContain("[PASS] Stage 5 (Economics Split)");
    expect(output).toContain("[FORGENT TEST SUCCESS] All qualification tests passed");
  });

  it("fails forgent test when manifest pricing violates allowed bounds", () => {
    const brokenDir = path.join(TMP_TEST_DIR, "broken-pricing-agent");
    fs.mkdirSync(brokenDir, { recursive: true });

    const manifest = {
      name: "Broken Agent",
      slug: "broken-agent",
      version: "1.0.0",
      category: "Finance",
      pricing: { pricePerTaskUsd: 150.00 }, // Violates $50 max limit
      inputSchema: { type: "object", properties: { q: { type: "string" } } },
      outputSchema: { type: "object", properties: { a: { type: "string" } } },
    };
    fs.writeFileSync(path.join(brokenDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    fs.writeFileSync(path.join(brokenDir, "agent.ts"), "export const a = 1;");

    expect(() => {
      execSync(`node "${CLI_PATH}" test --dir "${brokenDir}"`, { stdio: "pipe" });
    }).toThrow();
  });

  it("prepares package, computes SHA-256 digest and publishes via forgent publish", () => {
    const agentDir = path.join(TMP_TEST_DIR, "ledger-audit-sentinel");
    const output = execSync(
      `node "${CLI_PATH}" publish --dir "${agentDir}" --dry-run`,
      { encoding: "utf8" }
    );

    expect(output).toContain("[FORGENT PUBLISH] Executing pre-flight qualification checks...");
    expect(output).toContain("[FORGENT PUBLISH] Calculated Package SHA-256 Digest: sha256:");
    expect(output).toContain("[FORGENT PUBLISH SUCCESS] Agent package ready for deployment");
  });

  it("POST /api/builder/packages/upload validates manifest and cryptographic checksum", async () => {
    const manifest = {
      name: "Solidity Security Scanner",
      slug: "solidity-security-scanner",
      version: "1.0.0",
      category: "DevOps",
      pricing: { pricePerTaskUsd: 5.00, currency: "USD" },
      runtime: "node22",
      inputSchema: { source: "string" },
      outputSchema: { issues: "array" },
    };

    const files: Record<string, string> = {
      "manifest.json": JSON.stringify(manifest),
      "agent.ts": "export async function run() { return { issues: [] }; }",
    };

    const sortedKeys = Object.keys(files).sort();
    const canonical = sortedKeys.map((k) => `${k}:${files[k]}`).join("\n");
    const validChecksum = `sha256:${crypto.createHash("sha256").update(canonical).digest("hex")}`;

    const req = new NextRequest("http://localhost:3000/api/builder/packages/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manifest,
        files,
        sha256Checksum: validChecksum,
      }),
    });

    const res = await uploadPackageRoute(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.packageId).toMatch(/^pkg_/);
    expect(json.sha256).toBe(validChecksum);
  });

  it("POST /api/builder/packages/upload rejects corrupted or mismatched checksums", async () => {
    const manifest = {
      name: "Solidity Security Scanner",
      slug: "solidity-security-scanner",
      version: "1.0.0",
      category: "DevOps",
      pricing: { pricePerTaskUsd: 5.00, currency: "USD" },
      runtime: "node22",
      inputSchema: { source: "string" },
      outputSchema: { issues: "array" },
    };

    const files: Record<string, string> = {
      "manifest.json": JSON.stringify(manifest),
    };

    const corruptedChecksum = "sha256:0000000000000000000000000000000000000000000000000000000000000000";

    const req = new NextRequest("http://localhost:3000/api/builder/packages/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manifest,
        files,
        sha256Checksum: corruptedChecksum,
      }),
    });

    const res = await uploadPackageRoute(req);
    expect(res.status).toBe(422);

    const json = await res.json();
    expect(json.error).toBe("CHECKSUM_MISMATCH");
  });
});
