import { describe, expect, it } from "vitest";
import { describePrismaSchema } from "@/server/compiler/business-schema-description";

describe("business Prisma schema description", () => {
  it("extracts model fields without running the schema", () => {
    const result = describePrismaSchema(`model Receipt {
  id String @id
  notes String?
  lines Line[]
}`);
    expect(result.models[0]).toEqual({ name: "Receipt", fields: [
      { name: "id", type: "String", optional: false, list: false },
      { name: "notes", type: "String", optional: true, list: false },
      { name: "lines", type: "Line", optional: false, list: true },
    ] });
    expect(result.warnings).toEqual([]);
  });
  it("warns on incomplete input and rejects oversized uploads", () => {
    expect(describePrismaSchema("model Broken {").warnings).toContain("The schema contains an unclosed block.");
    expect(() => describePrismaSchema("x".repeat(200001))).toThrow();
  });
});
