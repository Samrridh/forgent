import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { rejectCrossOrigin } from "@/server/forgent/console-request";

describe("request origin validation", () => {
  it("accepts a matching browser origin when Next normalizes the URL hostname", () => {
    const request = new NextRequest("http://localhost:3010/api/builder/package-review", { headers: { host: "127.0.0.1:3010", origin: "http://127.0.0.1:3010" } });
    expect(rejectCrossOrigin(request)).toBeNull();
  });
  it("rejects other origins and mismatched ports", () => {
    for (const origin of ["http://attacker.example", "http://127.0.0.1:3011", "http://localhost:3010", "null"]) {
      const request = new NextRequest("http://localhost:3010/api/builder/package-review", { headers: { host: "127.0.0.1:3010", origin } });
      expect(rejectCrossOrigin(request)?.status).toBe(403);
    }
  });
});
