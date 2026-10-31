import { describe, it, expect } from "vitest";
import { INITIAL_CREATOR_AGENTS, INITIAL_PAYOUT_HISTORY } from "@/components/creator/creator-data";
import { STARTER_TEMPLATES } from "@/server/templates/template-definitions";

describe("Creator Studio & Verification Suite Unit Tests", () => {
  it("provides initial creator published agents with valid metrics", () => {
    expect(INITIAL_CREATOR_AGENTS.length).toBeGreaterThan(0);

    for (const agent of INITIAL_CREATOR_AGENTS) {
      expect(agent.id).toBeDefined();
      expect(agent.name.length).toBeGreaterThan(3);
      expect(agent.taskVolume30d).toBeGreaterThanOrEqual(0);
      expect(agent.successRate).toBeGreaterThanOrEqual(98.0);
      expect(agent.avgLatencyMs).toBeLessThan(1000);

      // Verify pricing bounds $0.50 to $50.00
      expect(agent.pricePerTaskUsd).toBeGreaterThanOrEqual(0.50);
      expect(agent.pricePerTaskUsd).toBeLessThanOrEqual(50.00);

      // Verify 1 USD = 80 INR rate consistency
      expect(agent.pricePerTaskInr).toBe(Math.round(agent.pricePerTaskUsd * 80));

      // Verify 85/15 revenue split calculation
      const expectedCreatorShareUsd = agent.pricePerTaskUsd * 0.85 * agent.taskVolume30d;
      expect(Math.abs(agent.earnings30dUsd - expectedCreatorShareUsd)).toBeLessThan(0.01);
    }
  });

  it("verifies dual-currency conversion consistency across all initial payout records", () => {
    for (const record of INITIAL_PAYOUT_HISTORY) {
      expect(record.transactionHash).toMatch(/^tx_0x[a-f0-9]+/);
      expect(record.amountUsd).toBeGreaterThan(0);
      expect(record.amountInr).toBe(Math.round(record.amountUsd * 80));
      expect(["UPI", "BANK_TRANSFER", "STRIPE"]).toContain(record.method);
      expect(record.status).toBe("SETTLED");
    }
  });

  it("verifies 85/15 revenue split bounds: $0.50-$50.00 / ₹40-₹4,000", () => {
    const minPriceUsd = 0.50;
    const maxPriceUsd = 50.00;

    const minCreatorShare = minPriceUsd * 0.85;
    const minNetworkShare = minPriceUsd * 0.15;
    expect(minCreatorShare).toBeCloseTo(0.425, 3);
    expect(minNetworkShare).toBeCloseTo(0.075, 3);

    const maxCreatorShare = maxPriceUsd * 0.85;
    const maxNetworkShare = maxPriceUsd * 0.15;
    expect(maxCreatorShare).toBe(42.50);
    expect(maxNetworkShare).toBe(7.50);
  });

  it("strictly enforces zero emojis across creator agent data and payout records", () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const agent of INITIAL_CREATOR_AGENTS) {
      expect(emojiRegex.test(agent.name)).toBe(false);
      expect(emojiRegex.test(agent.bio)).toBe(false);
      expect(emojiRegex.test(agent.category)).toBe(false);
    }

    for (const payout of INITIAL_PAYOUT_HISTORY) {
      expect(emojiRegex.test(payout.destinationAccount)).toBe(false);
      expect(emojiRegex.test(payout.method)).toBe(false);
    }
  });
});
