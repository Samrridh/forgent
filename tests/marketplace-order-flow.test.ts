import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
const mocks = vi.hoisted(() => ({ listing: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), invoke: vi.fn() }));
vi.mock("@/server/db", () => ({ db: { marketplaceListing: { findFirst: mocks.listing }, marketplaceOrder: { create: mocks.create, findUnique: mocks.findUnique, update: mocks.update } } }));
vi.mock("@/server/forgent/hosted-task-agent", () => ({ invokeHostedTask: mocks.invoke }));
import { POST } from "@/app/api/marketplace/orders/route";
const payload = { listingId: "listing-1", requestId: "123e4567-e89b-42d3-a456-426614174000", task: "Summarize this document", paymentMode: "DEMO_BYPASS" };
const request = (body: unknown) => new NextRequest("http://localhost/api/marketplace/orders", { method: "POST", body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); mocks.listing.mockResolvedValue({ id: "listing-1", endpointUrl: "https://agent.example/run", pricePaise: 100 }); });
describe("marketplace demo order", () => {
  it("records the bypass before dispatch and persists the actual response", async () => {
    mocks.create.mockResolvedValue({ id: "order-1" }); mocks.invoke.mockResolvedValue("Result");
    mocks.update.mockResolvedValue({ id: "order-1", status: "COMPLETED", result: { text: "Result" } });
    const response = await POST(request(payload));
    expect(response.status).toBe(201);
    expect(mocks.create.mock.calls[0][0].data.paymentStatus).toBe("DEMO_BYPASSED");
    expect(mocks.create.mock.invocationCallOrder[0]).toBeLessThan(mocks.invoke.mock.invocationCallOrder[0]);
    expect(mocks.update.mock.calls[0][0].data.result).toEqual({ text: "Result" });
  });
  it("does not invoke an agent twice for a repeated request", async () => {
    mocks.create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "7" }));
    mocks.findUnique.mockResolvedValue({ listingId: payload.listingId, task: payload.task, status: "COMPLETED" });
    expect((await POST(request(payload))).status).toBe(200);
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it("records an unknown outcome rather than assuming a failed endpoint did no work", async () => {
    mocks.create.mockResolvedValue({ id: "order-1" }); mocks.invoke.mockRejectedValue(new Error("offline"));
    mocks.update.mockResolvedValue({ id: "order-1", status: "UNKNOWN" });
    expect((await POST(request(payload))).status).toBe(502);
    expect(mocks.update.mock.calls[0][0].data.status).toBe("UNKNOWN");
  });
  it("does not mark a completed external action as failed when saving the result fails", async () => {
    mocks.create.mockResolvedValue({ id: "order-1" }); mocks.invoke.mockResolvedValue("Result");
    mocks.update.mockRejectedValue(new Error("database unavailable"));
    expect((await POST(request(payload))).status).toBe(503);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update.mock.calls[0][0].data.status).toBe("COMPLETED");
  });
});
