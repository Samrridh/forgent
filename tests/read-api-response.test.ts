import { describe, expect, it } from "vitest";
import { readApiResponse } from "@/lib/read-api-response";

describe("API response handling", () => {
  it("returns JSON responses", async () => {
    expect(await readApiResponse(new Response('{"error":"Try again"}', { status: 429 }))).toEqual({ error: "Try again" });
  });
  it("replaces an HTML server error with a readable message", async () => {
    await expect(readApiResponse(new Response("<!DOCTYPE html><html>Error</html>", { status: 500 }))).rejects.toThrow("The server returned an unexpected response (HTTP 500)");
  });
});
