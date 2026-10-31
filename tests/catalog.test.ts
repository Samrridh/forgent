import { describe, it, expect } from "vitest";
import catalogData from "@/data/agents-catalog.json";

describe("500-Agent Catalog Specification Suite", () => {
  const EXPECTED_DOMAINS = [
    "Finance",
    "Legal",
    "DevOps",
    "Health",
    "Data",
    "Marketing",
    "Support",
    "HR",
    "Cybersecurity",
    "E-Commerce",
    "Research",
    "Growth",
  ];

  it("contains exactly 500 catalog agents", () => {
    expect(catalogData).toHaveLength(500);
  });

  it("categorizes agents into all 12 specified industry domains", () => {
    const presentDomains = new Set(catalogData.map((a) => a.category));
    expect(presentDomains.size).toBe(12);

    for (const domain of EXPECTED_DOMAINS) {
      expect(presentDomains.has(domain)).toBe(true);
      const count = catalogData.filter((a) => a.category === domain).length;
      expect(count).toBeGreaterThanOrEqual(40);
    }
  });

  it("guarantees unique slugs for all 500 agents", () => {
    const slugs = catalogData.map((a) => a.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(500);
  });

  it("enriches top 60 showcase agents with input schemas, sample inputs, pricing, and benchmarks", () => {
    const showcaseAgents = catalogData.slice(0, 60);
    expect(showcaseAgents).toHaveLength(60);

    for (const agent of showcaseAgents) {
      expect(agent.isShowcase).toBe(true);
      expect(agent.title).toBeDefined();
      expect(agent.description.length).toBeGreaterThan(20);

      // Input / Output Schemas
      expect(agent.inputSchema).toBeDefined();
      expect(agent.inputSchema.type).toBe("object");
      expect(agent.inputSchema.properties).toBeDefined();
      expect(agent.outputSchema).toBeDefined();

      // Sample Inputs
      expect(agent.sampleInputs).toBeDefined();
      expect(typeof agent.sampleInputs).toBe("object");

      // Pricing ($0.50-$15.00 / ₹40-₹1,200)
      expect(agent.priceCents).toBeGreaterThanOrEqual(50);
      expect(agent.priceCents).toBeLessThanOrEqual(1500);
      expect(agent.pricePaise).toBeGreaterThanOrEqual(4000);
      expect(agent.pricePaise).toBeLessThanOrEqual(120000);

      // Benchmarks
      expect(agent.benchmark).toBeDefined();
      expect(agent.benchmark?.testSuites.length).toBeGreaterThanOrEqual(2);
      expect(agent.benchmark?.accuracyScore).toBeGreaterThanOrEqual(0.94);
      expect(agent.benchmark?.latencyMs).toBeGreaterThan(0);
      expect(agent.benchmark?.lastVerifiedAt).toBeDefined();
    }
  });

  it("ensures zero emojis in catalog titles and descriptions", () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    for (const agent of catalogData) {
      expect(emojiRegex.test(agent.title)).toBe(false);
      expect(emojiRegex.test(agent.description)).toBe(false);
    }
  });
});
