import { z } from "zod";

const propertySchema = z.object({ type: z.union([z.string(), z.array(z.string())]).optional() }).passthrough();
const objectSchema = z.object({ type: z.literal("object"), properties: z.record(z.string(), propertySchema), required: z.array(z.string()).optional() }).passthrough();
export type Compatibility = { status: "compatible" | "incompatible" | "unknown"; reasons: string[] };

/** Checks a deliberately limited JSON Schema subset; unhandled constraints remain unknown. */
export function checkStageCompatibility(output: unknown, input: unknown): Compatibility {
  const from = objectSchema.safeParse(output);
  const to = objectSchema.safeParse(input);
  if (!from.success || !to.success) return { status: "unknown", reasons: ["Both stages need object input and output schemas for a field check."] };
  const required = to.data.required ?? [];
  const issues: string[] = [];
  const unknown: string[] = [];
  for (const field of required) {
    const expected = to.data.properties[field];
    const actual = from.data.properties[field];
    if (!expected) { unknown.push(`Input field ${field} has no declared definition.`); continue; }
    if (!actual) { unknown.push(`Output does not declare required input field ${field}.`); continue; }
    if (!(from.data.required ?? []).includes(field)) { unknown.push(`Output field ${field} is not guaranteed.`); continue; }
    if (typeof actual.type !== "string" || typeof expected.type !== "string") { unknown.push(`Field ${field} has an unsupported or missing type.`); continue; }
    if (actual.type !== expected.type && !(actual.type === "integer" && expected.type === "number")) issues.push(`Field ${field} has output type ${actual.type} but needs ${expected.type}.`);
    else unknown.push(`Field ${field} has matching basic types; additional constraints need review.`);
  }
  if (issues.length) return { status: "incompatible", reasons: issues.concat(unknown) };
  return { status: "unknown", reasons: unknown.length ? unknown : ["No required fields could be conclusively checked."] };
}
