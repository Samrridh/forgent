import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock("@/server/forgent/hosted-task-agent", () => ({ invokeHostedTask: mocks.invoke }));
import { isLocalMarketplace, withLocalMarketplace } from "@/server/forgent/local-marketplace";
import { listLocalOrders, runLocalOrder } from "@/server/forgent/local-marketplace-orders";
let directory: string;
beforeEach(async () => { directory = await mkdtemp(path.join(tmpdir(), "forgent-marketplace-")); vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("FORGENT_DATA_DIR", directory); vi.stubEnv("DATABASE_URL", ""); mocks.invoke.mockReset(); });
afterEach(async () => { vi.unstubAllEnvs(); await rm(directory, { recursive: true, force: true }); });
describe("local marketplace", () => {
 it("uses local storage only without a configured database outside production", () => { expect(isLocalMarketplace()).toBe(true); vi.stubEnv("DATABASE_URL", "postgres://example/db"); expect(isLocalMarketplace()).toBe(false); vi.stubEnv("DATABASE_URL", ""); vi.stubEnv("NODE_ENV", "production"); expect(isLocalMarketplace()).toBe(false); });
 it("persists listings and completes an idempotent order", async () => {
  const testCase = { title: "Test", category: "functional" as const, purpose: "Check result", inputJson: "{}", expectedJson: "{}", expectation: "Matches" };
  await withLocalMarketplace(store => { store.listings.push({ id: "agent-1", createdAt: new Date().toISOString(), details: { name: "Support", description: "A local test support agent", category: "Support", endpointUrl: "https://example.com/run", inputSchema: {}, outputSchema: {}, pricePaise: 100, review: { summary: "Reviewed", findings: [], limitations: ["Demo"], proposedTests: [], evaluation: { evaluatedAt: new Date().toISOString(), passed: 1, failed: 0, unsupported: 0, errors: 0, scorePercent: 100, approvedCases: [testCase], cases: [{ title: "Test", status: "passed", detail: "OK" }] } } } }); }, true);
  mocks.invoke.mockResolvedValue("Done");
  const input = { listingId: "agent-1", requestId: "e5702d7c-8a8e-4bc0-8afe-ff1a0d702974", task: "Please help", paymentMode: "DEMO_BYPASS" as const };
  expect((await runLocalOrder(input)).status).toBe(201);
  expect((await runLocalOrder(input)).status).toBe(200);
  expect(mocks.invoke).toHaveBeenCalledTimes(1);
  expect(await listLocalOrders()).toMatchObject([{ status: "COMPLETED", result: { text: "Done" }, listing: { name: "Support" } }]);
  expect((await runLocalOrder({ ...input, task: "Another task" })).status).toBe(409);
 });
});
