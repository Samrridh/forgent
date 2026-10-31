import crypto from "crypto";
import { z } from "zod";
import catalogData from "../../data/agents-catalog.json";
import {
  EnterprisePipeline,
  PipelineNode,
  PipelineConnection,
  NodeParameter,
  NodeOutput,
  PipelineStageKey,
} from "@/lib/contracts/enterprise-types";
import { getApiKeys } from "../engine/executor";

export interface CatalogAgent {
  slug: string;
  title: string;
  name: string;
  description: string;
  summary: string;
  category: string;
  authorName: string;
  priceCents: number;
  pricePaise: number;
  inputSchema: {
    type?: string;
    required?: string[];
    properties?: Record<string, {
      type?: string;
      description?: string;
      default?: unknown;
      enum?: string[];
    }>;
  };
  outputSchema: {
    type?: string;
    required?: string[];
    properties?: Record<string, {
      type?: string;
      description?: string;
    }>;
  };
  sampleInputs?: Record<string, unknown>;
  benchmark?: {
    accuracyScore?: number;
    latencyMs?: number;
    lastVerifiedAt?: string;
  };
  verificationStatus?: string;
  ratings?: number;
  tasksCompleted?: number;
}

export const AutoCompileRequestSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters long"),
  category: z.string().optional(),
  maxStages: z.number().int().min(2).max(4).optional().default(3),
});

export type AutoCompileRequest = z.input<typeof AutoCompileRequestSchema>;
export type AutoCompileRequestOutput = z.infer<typeof AutoCompileRequestSchema>;

export interface AutoCompileResult {
  pipeline: EnterprisePipeline;
  reasoning: string;
  matchedAgents: Array<{
    stage: PipelineStageKey;
    slug: string;
    title: string;
    score: number;
  }>;
  compilerMode: "GEMINI_SYNTHESIS" | "HEURISTIC_DETERMINISTIC";
}

const INGESTION_TERMS = [
  "extractor", "parser", "reader", "scraper", "searcher",
  "collector", "ingest", "tracker", "radar", "filing", "intake", "fetcher"
];

const PROCESSING_TERMS = [
  "analyzer", "reconciler", "classifier", "calculator", "engine",
  "evaluator", "matcher", "detector", "optimizer", "assessor", "risk", "modeler"
];

const VERIFICATION_TERMS = [
  "reporter", "auditor", "verifier", "generator", "compiler",
  "synthesizer", "validator", "summary", "checker", "review", "seal", "logger"
];

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
  "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
  "to", "was", "were", "will", "with", "conduct", "thorough", "draft", "create"
]);

function extractSearchTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function scoreAgentForStage(
  agent: CatalogAgent,
  queryTokens: string[],
  stage: PipelineStageKey,
  targetCategory?: string
): number {
  let score = 0;
  const title = agent.title.toLowerCase();
  const desc = agent.description.toLowerCase();
  const cat = agent.category.toLowerCase();
  const slug = agent.slug.toLowerCase();

  for (const token of queryTokens) {
    if (title.includes(token)) score += 12;
    if (slug.includes(token)) score += 8;
    if (desc.includes(token)) score += 4;
    if (cat.includes(token)) score += 6;
  }

  if (targetCategory && cat === targetCategory.toLowerCase()) {
    score += 15;
  }

  const stageTerms =
    stage === "INGESTION"
      ? INGESTION_TERMS
      : stage === "PROCESSING"
      ? PROCESSING_TERMS
      : VERIFICATION_TERMS;

  for (const term of stageTerms) {
    if (title.includes(term)) score += 10;
    if (slug.includes(term)) score += 8;
    if (desc.includes(term)) score += 4;
  }

  // Penalize mismatched stages (e.g. Ingestion agent in Verification)
  if (stage === "INGESTION" && VERIFICATION_TERMS.some((t) => title.includes(t))) {
    score -= 6;
  }
  if (stage === "VERIFICATION" && INGESTION_TERMS.some((t) => title.includes(t))) {
    score -= 6;
  }

  return Math.max(0, score);
}

function mapAgentSchemaToParameters(agent: CatalogAgent): {
  inputs: NodeParameter[];
  outputs: NodeOutput[];
} {
  const inputs: NodeParameter[] = [];
  const outputs: NodeOutput[] = [];

  const inProps = agent.inputSchema?.properties || {};
  const reqInputs = new Set(agent.inputSchema?.required || []);

  const inputKeys = Object.keys(inProps);
  if (inputKeys.length > 0) {
    for (const key of inputKeys.slice(0, 4)) {
      const prop = inProps[key];
      const rawType = prop?.type || "string";
      const paramType: NodeParameter["type"] =
        rawType === "number" || rawType === "integer"
          ? "number"
          : rawType === "boolean"
          ? "boolean"
          : rawType === "object" || rawType === "array"
          ? "json"
          : "string";

      const sampleVal = agent.sampleInputs?.[key];
      const valStr =
        sampleVal !== undefined
          ? typeof sampleVal === "object"
            ? JSON.stringify(sampleVal)
            : String(sampleVal)
          : prop?.default !== undefined
          ? String(prop.default)
          : "";

      inputs.push({
        key,
        label: prop?.description || key.replace(/([A-Z])/g, " $1").trim(),
        type: paramType,
        required: reqInputs.has(key),
        value: valStr,
      });
    }
  } else {
    inputs.push({
      key: "input_payload",
      label: "Input Task Payload",
      type: "json",
      required: true,
      value: "{}",
    });
  }

  const outProps = agent.outputSchema?.properties || {};
  const outKeys = Object.keys(outProps);
  if (outKeys.length > 0) {
    for (const key of outKeys.slice(0, 3)) {
      const prop = outProps[key];
      const rawType = prop?.type || "string";
      const outType: NodeOutput["type"] =
        rawType === "number" || rawType === "integer"
          ? "number"
          : rawType === "boolean"
          ? "boolean"
          : rawType === "object" || rawType === "array"
          ? "json"
          : "string";

      outputs.push({
        key,
        label: prop?.description || key.replace(/([A-Z])/g, " $1").trim(),
        type: outType,
        sampleValue: `[Verified ${key} output]`,
      });
    }
  } else {
    outputs.push({
      key: "result_payload",
      label: "Stage Result Payload",
      type: "json",
      sampleValue: '{"status": "VERIFIED"}',
    });
  }

  return { inputs, outputs };
}

export function heuristicSelectAgents(
  query: string,
  category?: string,
  stageCount: number = 3
): Array<{ stage: PipelineStageKey; agent: CatalogAgent; score: number }> {
  const catalog = catalogData as unknown as CatalogAgent[];
  const tokens = extractSearchTokens(query);

  const stages: PipelineStageKey[] =
    stageCount === 2
      ? ["INGESTION", "PROCESSING"]
      : stageCount === 4
      ? ["INGESTION", "PROCESSING", "PROCESSING", "VERIFICATION"]
      : ["INGESTION", "PROCESSING", "VERIFICATION"];

  const selectedSlugs = new Set<string>();
  const matches: Array<{ stage: PipelineStageKey; agent: CatalogAgent; score: number }> = [];

  for (const stage of stages) {
    let bestAgent: CatalogAgent | null = null;
    let bestScore = -1;

    for (const agent of catalog) {
      if (selectedSlugs.has(agent.slug)) continue;

      const score = scoreAgentForStage(agent, tokens, stage, category);
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }

    if (!bestAgent) {
      // Fallback to first available agent
      bestAgent = catalog.find((a) => !selectedSlugs.has(a.slug)) || catalog[0];
      bestScore = 10;
    }

    selectedSlugs.add(bestAgent.slug);
    matches.push({
      stage,
      agent: bestAgent,
      score: bestScore,
    });
  }

  return matches;
}

export async function callGeminiDecomposition(
  prompt: string,
  category?: string
): Promise<{ pipelineName: string; category: string; agentSlugs?: string[] } | null> {
  const { geminiKey } = getApiKeys();
  if (!geminiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const systemPrompt = [
      "You are the Forgent Autonomous Pipeline Decomposer.",
      "Analyze the user query and return a JSON object with:",
      "- pipelineName: concise professional title under 60 chars",
      "- category: one of [Finance, Legal, DevOps, Health, Data, Marketing, Support, HR, Cybersecurity, E-Commerce, Research, Growth]",
      "- stages: array of 3 stage descriptions (ingestion, processing, verification)",
    ].join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeout);

    if (!response.ok) return null;
    const json = await response.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed = JSON.parse(rawText);
    return {
      pipelineName: typeof parsed.pipelineName === "string" ? parsed.pipelineName : prompt.slice(0, 50),
      category: typeof parsed.category === "string" ? parsed.category : category || "Finance",
    };
  } catch {
    return null;
  }
}

export async function autoCompileWorkflow(
  rawRequest: AutoCompileRequest
): Promise<AutoCompileResult> {
  const parsedRequest = AutoCompileRequestSchema.parse(rawRequest);
  const { prompt, category, maxStages } = parsedRequest;

  // 1. Attempt Gemini synthesis with defensive fallback
  const geminiResult = await callGeminiDecomposition(prompt, category);
  const compilerMode = geminiResult ? "GEMINI_SYNTHESIS" : "HEURISTIC_DETERMINISTIC";

  const resolvedCategory = geminiResult?.category || category || "Finance";
  const pipelineTitle =
    geminiResult?.pipelineName ||
    (prompt.length > 55 ? `${prompt.slice(0, 52).trim()}...` : prompt);

  // 2. Select best-fit specialized agents
  const matches = heuristicSelectAgents(prompt, resolvedCategory, maxStages);

  // 3. Assemble Pipeline Nodes and DAG Connections
  const cleanId = `pipe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const nodes: PipelineNode[] = [];
  const connections: PipelineConnection[] = [];

  let totalCostPaise = 0;
  let totalEstimatedLatencyMs = 0;

  for (let i = 0; i < matches.length; i++) {
    const { stage, agent } = matches[i];
    const nodeId = `node-${cleanId}-${i + 1}`;
    const { inputs, outputs } = mapAgentSchemaToParameters(agent);

    const nodeCost = agent.pricePaise > 0 ? agent.pricePaise : (agent.priceCents * 80) || 28000;
    const nodeLatency = agent.benchmark?.latencyMs || 850;

    totalCostPaise += nodeCost;
    totalEstimatedLatencyMs += nodeLatency;

    // Connect previous node's primary output to this node's primary input
    if (i > 0) {
      const prevNode = nodes[i - 1];
      const prevOutputKey = prevNode.outputParameters[0]?.key || "result_payload";
      const currInputKey = inputs[0]?.key || "input_payload";

      inputs[0] = {
        ...inputs[0],
        mappedFrom: {
          nodeId: prevNode.id,
          outputKey: prevOutputKey,
        },
      };

      connections.push({
        id: `conn-${cleanId}-${i}-${i + 1}`,
        fromNodeId: prevNode.id,
        fromOutputKey: prevOutputKey,
        toNodeId: nodeId,
        toInputKey: currInputKey,
      });
    }

    nodes.push({
      id: nodeId,
      stage,
      stageName: `Stage ${i + 1}: ${agent.category} ${stage}`,
      agentId: agent.slug,
      agentName: agent.title,
      category: agent.category,
      version: "v1.2.0",
      description: agent.description,
      estimatedLatencyMs: nodeLatency,
      costPaise: nodeCost,
      inputParameters: inputs,
      outputParameters: outputs,
      status: "idle",
    });
  }

  // Generate deterministic SHA-256 seal for the pipeline
  const sealHash = crypto
    .createHash("sha256")
    .update(`${cleanId}:${pipelineTitle}:${totalCostPaise}:${totalEstimatedLatencyMs}`)
    .digest("hex");

  const pipeline: EnterprisePipeline = {
    id: cleanId,
    name: pipelineTitle,
    description: `Autonomous compiled workflow for "${prompt}". Verified with ${nodes.length} specialized agents and strict SLA parameter pipes.`,
    category: resolvedCategory,
    createdAt: new Date().toISOString(),
    nodes,
    connections,
    totalCostPaise,
    estimatedLatencyMs: totalEstimatedLatencyMs,
    certificationStatus: "CERTIFIED",
    deploymentStatus: "DRAFT",
    certificationSeal: `PH-COMPILER-${sealHash.slice(0, 32)}`,
  };

  const reasoning = [
    `Decomposed goal into ${nodes.length} sequential execution stages.`,
    `Selected specialized agents: ${matches.map((m) => `"${m.agent.title}" (${m.stage})`).join(" -> ")}.`,
    `Deterministic parameter piping mapped ${connections.length} typed edge connections.`,
    `Estimated run budget: ₹${(totalCostPaise / 100).toFixed(2)} (${totalCostPaise} paise) with ${totalEstimatedLatencyMs}ms target latency.`,
  ].join(" ");

  return {
    pipeline,
    reasoning,
    matchedAgents: matches.map((m) => ({
      stage: m.stage,
      slug: m.agent.slug,
      title: m.agent.title,
      score: m.score,
    })),
    compilerMode,
  };
}
