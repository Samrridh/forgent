import { describe, expect, it } from "vitest";
import { HostedTaskError, HostedTaskResponseSchema, resolveHostedEndpoint } from "@/server/forgent/hosted-task-agent";
import { MarketplaceListingInputSchema, MarketplaceOrderInputSchema } from "@/server/forgent/marketplace-contracts";

describe("hosted marketplace contracts", () => {
  it("rejects local, insecure, and credential-bearing endpoint URLs before connecting", async () => {
    for (const url of ["http://localhost:3000", "https://127.0.0.1/run", "https://user:pass@example.com/run", "https://example.com/run?token=secret"]) {
      await expect(resolveHostedEndpoint(url)).rejects.toBeInstanceOf(HostedTaskError);
    }
  });
  it("accepts only a structured task result", () => {
    expect(HostedTaskResponseSchema.safeParse({ result: "Complete" }).success).toBe(true);
    expect(HostedTaskResponseSchema.safeParse({ result: "", extra: true }).success).toBe(false);
  });
  it("requires an explicit demo bypass and integer paise", () => {
    expect(MarketplaceOrderInputSchema.safeParse({ listingId: "listing", requestId: crypto.randomUUID(), task: "Summarize this", paymentMode: "PAID" }).success).toBe(false);
    expect(MarketplaceListingInputSchema.safeParse({ name: "Test", description: "An agent with enough detail.", category: "Research", endpointUrl: "https://example.com", inputSchema: {}, outputSchema: {}, pricePaise: 1.5, review: {} }).success).toBe(false);
  });
});
