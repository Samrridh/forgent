import { describe, it, expect } from "vitest";
import { STARTER_TEMPLATES, getStarterTemplateById } from "@/server/templates/template-definitions";
import { GET } from "@/app/api/templates/[id]/export/route";
import { NextRequest } from "next/server";
import JSZip from "jszip";

describe("Templates Hub & ZIP Export Suite", () => {
  it("contains all 5 production TypeScript starter templates", () => {
    expect(STARTER_TEMPLATES).toHaveLength(5);

    const ids = STARTER_TEMPLATES.map((t) => t.id);
    expect(ids).toContain("financial-auditor");
    expect(ids).toContain("smart-contract-reviewer");
    expect(ids).toContain("legal-contract-analyzer");
    expect(ids).toContain("customer-support-agent");
    expect(ids).toContain("seo-researcher");
  });

  it("ensures every template contains all 5 required files with valid content", () => {
    const requiredFiles = [
      "package.json",
      "tsconfig.json",
      "src/index.ts",
      ".env.example",
      "README.md",
    ];

    for (const template of STARTER_TEMPLATES) {
      for (const file of requiredFiles) {
        expect(template.files[file], `Missing file ${file} in ${template.id}`).toBeDefined();
        expect(template.files[file].length).toBeGreaterThan(10);
      }

      // Check package.json parses as valid JSON
      const pkg = JSON.parse(template.files["package.json"]);
      expect(pkg.name).toBeDefined();
      expect(pkg.scripts?.build).toBeDefined();

      // Check tsconfig.json parses as valid JSON
      const tsconfig = JSON.parse(template.files["tsconfig.json"]);
      expect(tsconfig.compilerOptions).toBeDefined();
    }
  });

  it("strictly enforces zero emojis in template titles, descriptions, and taglines", () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const template of STARTER_TEMPLATES) {
      expect(emojiRegex.test(template.title)).toBe(false);
      expect(emojiRegex.test(template.tagline)).toBe(false);
      expect(emojiRegex.test(template.description)).toBe(false);
      for (const tag of template.tags) {
        expect(emojiRegex.test(tag)).toBe(false);
      }
      for (const cap of template.capabilities) {
        expect(emojiRegex.test(cap)).toBe(false);
      }
    }
  });

  it("exports valid ZIP buffer via GET /api/templates/[id]/export", async () => {
    const req = new NextRequest("http://localhost:3000/api/templates/financial-auditor/export");
    const response = await GET(req, {
      params: Promise.resolve({ id: "financial-auditor" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    expect(response.headers.get("Content-Disposition")).toContain("attachment; filename=");

    const arrayBuffer = await response.arrayBuffer();
    expect(arrayBuffer.byteLength).toBeGreaterThan(500);

    // Verify unzipping
    const zip = await JSZip.loadAsync(arrayBuffer);
    const filenames = Object.keys(zip.files);
    expect(filenames.some((name) => name.endsWith("package.json"))).toBe(true);
    expect(filenames.some((name) => name.endsWith("src/index.ts"))).toBe(true);
    expect(filenames.some((name) => name.endsWith("README.md"))).toBe(true);
  });

  it("returns 404 for unknown template export", async () => {
    const req = new NextRequest("http://localhost:3000/api/templates/non-existent/export");
    const response = await GET(req, {
      params: Promise.resolve({ id: "non-existent" }),
    });

    expect(response.status).toBe(404);
  });
});
