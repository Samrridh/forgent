import { env } from "../env";
import { ExecutionLogItem } from "./receipt";

export interface ExecutorInput {
  jobId: string;
  agentSlug: string;
  agentTitle: string;
  agentDescription: string;
  inputPayload: Record<string, unknown>;
  onProgress?: (step: string, message: string) => void;
}

export interface ExecutionDiagnostic {
  openaiConfigured: boolean;
  geminiConfigured: boolean;
  hint: string;
}

export interface ExecutionSuccessResult {
  success: true;
  jobId: string;
  agentSlug: string;
  modelUsed: string;
  latencyMs: number;
  tokensUsed: number;
  systemPrompt: string;
  executionLogs: ExecutionLogItem[];
  structuredJson: Record<string, unknown>;
  summaryMarkdown: string;
}

export interface ExecutionFailureResult {
  success: false;
  jobId: string;
  agentSlug: string;
  error: string;
  message: string;
  diagnostic?: ExecutionDiagnostic;
  systemPrompt?: string;
  executionLogs: ExecutionLogItem[];
}

export type ExecutionResult = ExecutionSuccessResult | ExecutionFailureResult;

/**
 * Returns available API key credentials from process environment or parsed env config.
 */
export function getApiKeys(): {
  openaiKey?: string;
  geminiKey?: string;
} {
  const openaiKey = process.env.OPENAI_API_KEY || env.OPENAI_API_KEY;
  const geminiKey =
    process.env.GEMINI_API_KEY ||
    env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    env.GOOGLE_GENERATIVE_AI_API_KEY;

  return {
    openaiKey: openaiKey && openaiKey.trim() !== "" ? openaiKey.trim() : undefined,
    geminiKey: geminiKey && geminiKey.trim() !== "" ? geminiKey.trim() : undefined,
  };
}

/**
 * Assembles the deterministic system instruction for the agent execution.
 */
export function buildSystemPrompt(agentSlug: string, agentTitle: string, agentDescription: string): string {
  return [
    `You are the specialized Forgent autonomous execution agent: "${agentTitle}" (${agentSlug}).`,
    `Agent Profile: ${agentDescription}`,
    `Execute the task defined by the user input payload with rigorous precision.`,
    `Output your final response strictly as a JSON object adhering to the schema:`,
    `{`,
    `  "status": "COMPLETED",`,
    `  "summary": "Brief executive summary markdown of actions and results",`,
    `  "data": { ... structured findings, calculations, or outputs ... }`,
    `}`,
  ].join("\n");
}

/**
 * Executes a task using a live LLM backend (OpenAI or Google Gemini).
 * If no API key is configured, returns an explicit clear diagnostic failure.
 */
export async function executeAgentTask(params: ExecutorInput): Promise<ExecutionResult> {
  const { jobId, agentSlug, agentTitle, agentDescription, inputPayload, onProgress } = params;
  const logs: ExecutionLogItem[] = [];

  const addLog = (step: string, message: string) => {
    const entry: ExecutionLogItem = {
      timestamp: new Date().toISOString(),
      step,
      message,
    };
    logs.push(entry);
    if (onProgress) {
      onProgress(step, message);
    }
  };

  addLog("INITIALIZATION", `Initializing execution run for agent ${agentSlug}`);
  const { openaiKey, geminiKey } = getApiKeys();

  const systemPrompt = buildSystemPrompt(agentSlug, agentTitle, agentDescription);
  const userPrompt = JSON.stringify(inputPayload, null, 2);

  // Diagnostic failure gate if keys are missing
  if (!openaiKey && !geminiKey) {
    addLog("API_KEY_CHECK_FAILED", "Neither OPENAI_API_KEY nor GEMINI_API_KEY found in environment");
    return {
      success: false,
      jobId,
      agentSlug,
      error: "MISSING_API_KEY",
      message:
        "Execution failed: No valid API key found. Please set OPENAI_API_KEY or GEMINI_API_KEY in environment variables.",
      diagnostic: {
        openaiConfigured: false,
        geminiConfigured: false,
        hint: "Provide an OPENAI_API_KEY or GEMINI_API_KEY in your .env configuration to execute live model inferences.",
      },
      systemPrompt,
      executionLogs: logs,
    };
  }

  const startTime = Date.now();

  // Route 1: Google Gemini Execution
  if (geminiKey) {
    addLog("DISPATCH_GEMINI", "Dispatching request to Google Gemini API (gemini-1.5-flash)");
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        addLog("GEMINI_ERROR", `Gemini API returned HTTP ${response.status}: ${errorText}`);
        return {
          success: false,
          jobId,
          agentSlug,
          error: `GEMINI_HTTP_${response.status}`,
          message: `Gemini execution failed with HTTP ${response.status}: ${errorText}`,
          systemPrompt,
          executionLogs: logs,
        };
      }

      const json = await response.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const tokensUsed = json?.usageMetadata?.totalTokenCount || 0;

      let structuredJson: Record<string, unknown> = {};
      try {
        structuredJson = JSON.parse(rawText);
      } catch {
        structuredJson = { rawOutput: rawText };
      }

      addLog("EXECUTION_COMPLETED", `Gemini generation completed in ${latencyMs}ms (${tokensUsed} tokens)`);

      return {
        success: true,
        jobId,
        agentSlug,
        modelUsed: "gemini-1.5-flash",
        latencyMs,
        tokensUsed,
        systemPrompt,
        executionLogs: logs,
        structuredJson,
        summaryMarkdown:
          typeof structuredJson.summary === "string"
            ? structuredJson.summary
            : `Completed execution for ${agentTitle}.`,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog("NETWORK_ERROR", `Gemini network error: ${errMsg}`);
      return {
        success: false,
        jobId,
        agentSlug,
        error: "NETWORK_ERROR",
        message: `Network communication failure with Gemini API: ${errMsg}`,
        systemPrompt,
        executionLogs: logs,
      };
    }
  }

  // Route 2: OpenAI Execution
  addLog("DISPATCH_OPENAI", "Dispatching request to OpenAI API (gpt-4o-mini)");
  try {
    const url = "https://api.openai.com/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      addLog("OPENAI_ERROR", `OpenAI API returned HTTP ${response.status}: ${errorText}`);
      return {
        success: false,
        jobId,
        agentSlug,
        error: `OPENAI_HTTP_${response.status}`,
        message: `OpenAI execution failed with HTTP ${response.status}: ${errorText}`,
        systemPrompt,
        executionLogs: logs,
      };
    }

    const json = await response.json();
    const rawContent = json?.choices?.[0]?.message?.content || "{}";
    const tokensUsed = json?.usage?.total_tokens || 0;

    let structuredJson: Record<string, unknown> = {};
    try {
      structuredJson = JSON.parse(rawContent);
    } catch {
      structuredJson = { rawOutput: rawContent };
    }

    addLog("EXECUTION_COMPLETED", `OpenAI generation completed in ${latencyMs}ms (${tokensUsed} tokens)`);

    return {
      success: true,
      jobId,
      agentSlug,
      modelUsed: "gpt-4o-mini",
      latencyMs,
      tokensUsed,
      systemPrompt,
      executionLogs: logs,
      structuredJson,
      summaryMarkdown:
        typeof structuredJson.summary === "string"
          ? structuredJson.summary
          : `Completed execution for ${agentTitle}.`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    addLog("NETWORK_ERROR", `OpenAI network error: ${errMsg}`);
    return {
      success: false,
      jobId,
      agentSlug,
      error: "NETWORK_ERROR",
      message: `Network communication failure with OpenAI API: ${errMsg}`,
      systemPrompt,
      executionLogs: logs,
    };
  }
}
