import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { inspectReviewArchive, parseReviewSchema } from "@/server/builder/evaluation/package-review-archive";

async function archive(files: Record<string, string>): Promise<ArrayBuffer> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) zip.file(path, content);
  return (await zip.generateAsync({ type: "uint8array" })).buffer as ArrayBuffer;
}
describe("static package intake", () => {
  it("reads source text without executing it", async () => {
    const files = await inspectReviewArchive(await archive({ "index.js": "throw new Error('not executed')" }));
    expect(files[0].content).toContain("not executed");
    expect(parseReviewSchema('{"type":"object"}')).toEqual({ type: "object" });
  });
  it("rejects path traversal, credentials, and oversized source files", async () => {
    await expect(inspectReviewArchive(await archive({ "../index.js": "x" }))).rejects.toThrow();
    await expect(inspectReviewArchive(await archive({ ".env": "TOKEN=secret" }))).rejects.toThrow();
    await expect(inspectReviewArchive(await archive({ "index.js": "x".repeat(100001) }))).rejects.toThrow();
  });
  it("rejects non-object JSON schemas", () => expect(() => parseReviewSchema("[]")).toThrow());
});
