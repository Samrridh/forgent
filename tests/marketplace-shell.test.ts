import { describe, it, expect } from "vitest";
import { AGENTS_DATASET, AGENT_CATEGORIES, searchAgents, getAgentBySlug } from "@/data/agents";

describe("Forgent Marketplace Shell & Agent Catalog Suite", () => {
  it("exports exactly 500 verified agents", () => {
    expect(AGENTS_DATASET).toBeDefined();
    expect(AGENTS_DATASET.length).toBe(500);
  });

  it("covers all 12 industry domain categories", () => {
    expect(AGENT_CATEGORIES.length).toBe(12);

    const counts: Record<string, number> = {};
    for (const agent of AGENTS_DATASET) {
      counts[agent.category] = (counts[agent.category] || 0) + 1;
    }

    for (const cat of AGENT_CATEGORIES) {
      expect(counts[cat]).toBeDefined();
      expect(counts[cat]).toBeGreaterThanOrEqual(40);
    }
  });

  it("verifies dual-currency price consistency (1 USD = 80 INR)", () => {
    for (const agent of AGENTS_DATASET) {
      expect(agent.pricePerTaskUsd).toBeGreaterThanOrEqual(0.5);
      expect(agent.pricePerTaskUsd).toBeLessThanOrEqual(15.0);
      expect(agent.pricePerTaskInr).toBe(Math.round(agent.pricePerTaskUsd * 80));
    }
  });

  it("ensures verified benchmark properties are well-formed", () => {
    const verifiedAgents = AGENTS_DATASET.filter((a) => a.verified);
    expect(verifiedAgents.length).toBeGreaterThan(300);

    for (const agent of verifiedAgents) {
      expect(agent.benchmarkScore).toBeGreaterThanOrEqual(90);
      expect(agent.benchmarkScore).toBeLessThanOrEqual(100);
      expect(agent.rating).toBeGreaterThanOrEqual(4.0);
      expect(agent.tasksCompleted).toBeGreaterThan(0);
    }
  });

  it("performs instant fuzzy search across titles, handles, and tags", () => {
    const financeResults = searchAgents("reconcil");
    expect(financeResults.length).toBeGreaterThan(0);
    expect(financeResults.every((a) => a.title.toLowerCase().includes("reconcil") || a.bio.toLowerCase().includes("reconcil") || a.tags.some(t => t.toLowerCase().includes("reconcil")))).toBe(true);

    const handleResults = searchAgents("@scale_finance");
    expect(handleResults.length).toBeGreaterThan(0);
    expect(handleResults.every((a) => a.creatorHandle === "@scale_finance")).toBe(true);
  });

  it("retrieves individual agent by slug or id", () => {
    const firstAgent = AGENTS_DATASET[0];
    const retrieved = getAgentBySlug(firstAgent.slug);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(firstAgent.id);
  });

  it("strictly enforces zero emojis across agent titles and descriptions", () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const agent of AGENTS_DATASET) {
      expect(emojiRegex.test(agent.title)).toBe(false);
      expect(emojiRegex.test(agent.bio)).toBe(false);
      for (const tag of agent.tags) {
        expect(emojiRegex.test(tag)).toBe(false);
      }
    }
  });
});
