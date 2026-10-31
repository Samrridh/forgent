import { describe, expect, it } from "vitest";
import { checkStageCompatibility } from "@/server/compiler/stage-compatibility";
describe("stage compatibility", () => {
  it("flags missing required fields and type mismatches", () => {
    expect(checkStageCompatibility({type:"object",properties:{id:{type:"number"}},required:["id"]}, {type:"object",properties:{id:{type:"string"}},required:["id"]}).status).toBe("incompatible");
    expect(checkStageCompatibility({type:"object",properties:{}}, {type:"object",properties:{id:{type:"string"}},required:["id"]}).status).toBe("unknown");
  });
  it("does not claim compatibility for missing schemas or unverified constraints", () => {
    expect(checkStageCompatibility(null, null).status).toBe("unknown");
    const schema = {type:"object",properties:{id:{type:"string"}},required:["id"]};
    expect(checkStageCompatibility(schema, schema).status).toBe("unknown");
  });
});
