import { NextRequest } from "next/server";
import { POST as runSample } from "@/app/api/builder/sample-agent/route";
import { AgentOutputSchema } from "@/server/forgent/contracts";

import { HOSTED_SAMPLE_ARTICLES } from "@/lib/contracts/hosted-sample-fixtures";

/** Executes the platform-owned deterministic sample, never uploaded source code. */
export async function runHostedSample(task: string): Promise<string> {
  const request = new NextRequest("http://localhost/api/builder/sample-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: task, articles: HOSTED_SAMPLE_ARTICLES }) });
  const response = await runSample(request);
  if (!response.ok) throw new Error("Hosted sample failed.");
  return AgentOutputSchema.parse(await response.json()).answer;
}
