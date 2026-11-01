import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { inspectReviewArchive, parseReviewSchema } from "@/server/builder/evaluation/package-review-archive";
import { PackageReviewSchema } from "@/server/builder/evaluation/package-review-contract";
import { rejectCrossOrigin } from "@/server/forgent/console-request";
import { HostedManifestSchema } from "@/server/forgent/hosted-package";
import { packageReviewPrompt } from "@/server/builder/evaluation/package-review-prompt";
import { HOSTED_SAMPLE_CASES } from "@/lib/contracts/hosted-sample-fixtures";

const metadataSchema = z.strictObject({ name: z.string().trim().min(3).max(80), description: z.string().trim().min(10).max(2000), inputSchema: z.string().max(20000), outputSchema: z.string().max(20000) });
const responseJsonSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    findings: { type: "array", items: { type: "object", properties: {
      category: { type: "string", enum: ["contract", "functionality", "reliability", "security", "maintainability"] },
      severity: { type: "string", enum: ["high", "medium", "low", "info"] },
      summary: { type: "string" }, evidence: { type: "string" }, recommendation: { type: "string" },
    }, required: ["category", "severity", "summary", "evidence", "recommendation"] } },
    limitations: { type: "array", items: { type: "string" } },
    proposedTests: { type: "array", items: { type: "object", properties: {
      title: { type: "string" }, category: { type: "string", enum: ["functional", "schema", "edge_case", "adversarial", "reliability"] },
      purpose: { type: "string" }, inputJson: { type: "string" }, expectedJson: { type: "string" }, expectation: { type: "string" },
    }, required: ["title", "category", "purpose", "inputJson", "expectedJson", "expectation"] } },
  },
  required: ["summary", "findings", "limitations", "proposedTests"],
};

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Package review requires production authentication before it can be enabled." }, { status: 503 });
  const denied = rejectCrossOrigin(request);
  if (denied) return denied;
  if (Number(request.headers.get("content-length") || 0) > 1200000) return NextResponse.json({ error: "Upload exceeds the size limit." }, { status: 413 });
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return NextResponse.json({ error: "OpenRouter is not configured on the server." }, { status: 503 });
  let payload: { name: string; description: string; inputSchema: unknown; outputSchema: unknown; files: { path: string; content: string }[] };
  try {
    const form = await request.formData();
    const file = form.get("package");
    if (!(file instanceof File)) throw new Error("Choose a ZIP package.");
    if (!file.name.toLowerCase().endsWith(".zip") || file.size === 0 || file.size > 1024 * 1024) throw new Error("Choose a ZIP package under 1 MB.");
    const metadata = metadataSchema.parse({ name: form.get("name"), description: form.get("description"), inputSchema: form.get("inputSchema"), outputSchema: form.get("outputSchema") });
    payload = { name: metadata.name, description: metadata.description, inputSchema: parseReviewSchema(metadata.inputSchema), outputSchema: parseReviewSchema(metadata.outputSchema), files: await inspectReviewArchive(await file.arrayBuffer()) };
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && !(error instanceof z.ZodError) && !(error instanceof SyntaxError) ? error.message : "Provide valid details, JSON object schemas, and a supported ZIP." }, { status: 400 });
  }
  let hostedRuntime: "knowledge-support-v1" | null = null;
  if (payload.files.length === 1 && payload.files[0].path === "manifest.json") {
    try { if (HostedManifestSchema.safeParse(JSON.parse(payload.files[0].content)).success) hostedRuntime = "knowledge-support-v1"; } catch { /* Not a supported manifest. */ }
  }
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(45000),
      body: JSON.stringify({ model: "openrouter/free", messages: [{ role: "system", content: packageReviewPrompt(Boolean(hostedRuntime)) }, { role: "user", content: JSON.stringify({ ...payload, responseSchema: responseJsonSchema, evaluator: { input: { task: "string" }, output: { result: "string" }, comparison: "exact" }, ...(hostedRuntime ? { platformSampleFixtures: HOSTED_SAMPLE_CASES } : {}) }) }], response_format: { type: "json_object" }, temperature: 0.2 }),
    });
    if (!response.ok) throw new Error("provider error");
    const envelope = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1) }).parse(await response.json());
    const report = PackageReviewSchema.parse(JSON.parse(envelope.choices[0].message.content));
    return NextResponse.json({ report, filesReviewed: payload.files.map((file) => file.path), evaluatedAt: new Date().toISOString(), hostedRuntime });
  } catch {
    return NextResponse.json({ error: "The review service could not produce a valid report. Please try again." }, { status: 502 });
  }
}
