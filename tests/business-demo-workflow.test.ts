import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/business/workflows/support-demo/route";
import { HOSTED_SAMPLE_CASES } from "@/lib/contracts/hosted-sample-fixtures";

const request = (body: unknown) => new NextRequest("http://localhost/api/business/workflows/support-demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
describe("platform support demo endpoint", () => {
  it("returns the expected results for all published sample cases", async () => {
    for (const test of HOSTED_SAMPLE_CASES) {
      const response = await POST(request(JSON.parse(test.inputJson)));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(JSON.parse(test.expectedJson));
    }
  });
  it("rejects malformed and unexpected input fields", async () => {
    expect((await POST(request({ task: "", other: true }))).status).toBe(400);
  });
});
