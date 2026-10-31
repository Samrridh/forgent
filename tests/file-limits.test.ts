import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(tsx?|jsx?|css)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

describe("Forgent Architecture & Repository Guidelines Compliance", () => {
  it("strictly enforces that NO source file exceeds 1,000 lines of code", () => {
    const srcDir = path.resolve(__dirname, "../src");
    const files = getAllFiles(srcDir);

    expect(files.length).toBeGreaterThan(10);

    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n").length;
      expect(
        lines,
        `File ${path.relative(srcDir, file)} exceeds 1,000 lines (${lines} lines)`
      ).toBeLessThanOrEqual(1000);
    }
  });

  it("strictly enforces zero emojis across creator, templates, and UI components", () => {
    const targetDirs = [
      path.resolve(__dirname, "../src/components/creator"),
      path.resolve(__dirname, "../src/components/templates"),
      path.resolve(__dirname, "../src/components/enterprise"),
      path.resolve(__dirname, "../src/server/templates"),
      path.resolve(__dirname, "../src/app/templates"),
      path.resolve(__dirname, "../src/app/creator"),
      path.resolve(__dirname, "../src/app/enterprise"),
    ];

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const dir of targetDirs) {
      if (!fs.existsSync(dir)) continue;
      const files = getAllFiles(dir);
      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        expect(
          emojiRegex.test(content),
          `Found emoji in ${path.basename(file)}`
        ).toBe(false);
      }
    }
  });
});
