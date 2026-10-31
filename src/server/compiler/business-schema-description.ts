import { z } from "zod";

const FieldSchema = z.object({ name: z.string(), type: z.string(), optional: z.boolean(), list: z.boolean() });
export const BusinessDataModelSchema = z.object({ name: z.string(), fields: z.array(FieldSchema) });
export const BusinessSchemaDescriptionSchema = z.object({
  models: z.array(BusinessDataModelSchema),
  warnings: z.array(z.string()),
});
export type BusinessSchemaDescription = z.infer<typeof BusinessSchemaDescriptionSchema>;

/** Extract a reviewable description; this never executes the uploaded schema. */
export function describePrismaSchema(source: string): BusinessSchemaDescription {
  if (source.length > 200_000) throw new Error("Schema exceeds the 200 KB limit.");
  const models: BusinessSchemaDescription["models"] = [];
  const warnings: string[] = [];
  const lines = source.split(/\r?\n/);
  let current: BusinessSchemaDescription["models"][number] | undefined;
  let otherBlock = false;
  for (const [index, raw] of lines.entries()) {
    const line = raw.replace(/\/\/.*$/, "").trim();
    if (!line) continue;
    if (otherBlock) { if (line === "}") otherBlock = false; continue; }
    if (!current) {
      const model = /^model\s+([A-Za-z_]\w*)\s*\{$/.exec(line);
      if (model) { current = { name: model[1], fields: [] }; continue; }
      if (/^(generator|datasource|enum|type|view)\s+\w+\s*\{$/.test(line)) { otherBlock = true; continue; }
      warnings.push(`Line ${index + 1}: unsupported declaration.`);
      continue;
    }
    if (line === "}") { models.push(current); current = undefined; continue; }
    if (line.startsWith("@@")) continue;
    const field = /^([A-Za-z_]\w*)\s+([A-Za-z_]\w*)(\[\]|\?)?(?:\s|$)/.exec(line);
    if (!field) { warnings.push(`Line ${index + 1}: could not read field.`); continue; }
    current.fields.push({ name: field[1], type: field[2], optional: field[3] === "?", list: field[3] === "[]" });
  }
  if (current || otherBlock) warnings.push("The schema contains an unclosed block.");
  if (!models.length) warnings.push("No complete models were found.");
  return BusinessSchemaDescriptionSchema.parse({ models, warnings });
}
