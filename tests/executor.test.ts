import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { executeAgentTask, buildSystemPrompt } from "@/server/engine/executor";

describe("LLM Execution Engine Suite", () => {
  const originalOpenAi = process.env.OPENAI_API_KEY;
  const originalGemini = process.env.GEMINI_API_KEY;
  const originalGoogleGen = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  });

  afterEach(() => {
    if (originalOpenAi) process.env.OPENAI_API_KEY = originalOpenAi;
    if (originalGemini) process.env.GEMINI_API_KEY = originalGemini;
    if (originalGoogleGen) process.env.GOOGLE_GENERATIVE_AI_API_KEY = originalGoogleGen;
    vi.restoreAllMocks();
  });

  it("returns explicit clear diagnostic failure when API keys are missing", async () => {
    const result = await executeAgentTask({
      jobId: "job-diag-001",
      agentSlug: "sec-10k-financial-analyst",
      agentTitle: "SEC 10-K & 10-Q Financial Filing Extractor",
      agentDescription: "Parses SEC filings",
      inputPayload: { ticker: "AAPL" },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("MISSING_API_KEY");
      expect(result.message).toContain("No valid API key found");
      expect(result.diagnostic).toBeDefined();
      expect(result.diagnostic?.openaiConfigured).toBe(false);
      expect(result.diagnostic?.geminiConfigured).toBe(false);
      expect(result.diagnostic?.hint).toContain("OPENAI_API_KEY");
      expect(result.executionLogs.some((l) => l.step === "API_KEY_CHECK_FAILED")).toBe(true);
    }
  });

  it("assembles correct deterministic system prompt", () => {
    const prompt = buildSystemPrompt(
      "k8s-pod-crashloop-diagnostician",
      "Kubernetes CrashLoopBackOff Diagnostician",
      "Ingests container logs to pinpoint root cause"
    );

    expect(prompt).toContain("Forgent autonomous execution agent");
    expect(prompt).toContain("Kubernetes CrashLoopBackOff Diagnostician");
    expect(prompt).toContain("k8s-pod-crashloop-diagnostician");
    expect(prompt).toContain('"status": "COMPLETED"');
  });

  it("dispatches live call when GEMINI_API_KEY is configured", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";

    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  status: "COMPLETED",
                  summary: "Root cause: OOMKilled memory limit exceeded.",
                  data: { exitCode: 137, oomKilled: true },
                }),
              },
            ],
          },
        },
      ],
      usageMetadata: { totalTokenCount: 320 },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as unknown as Response);

    const result = await executeAgentTask({
      jobId: "job-gemini-001",
      agentSlug: "k8s-pod-crashloop-diagnostician",
      agentTitle: "Kubernetes CrashLoopBackOff Diagnostician",
      agentDescription: "Diagnostics",
      inputPayload: { pod: "billing-svc" },
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.modelUsed).toBe("gemini-1.5-flash");
      expect(result.tokensUsed).toBe(320);
      expect(result.summaryMarkdown).toContain("Root cause");
      expect(result.structuredJson.data).toBeDefined();
    }
  });
});
