import { z } from "zod";

export const CreatorAnalyticsQuerySchema = z.object({
  timeframe: z.enum(["7d", "30d", "90d", "all"]).optional().default("30d"),
  creatorId: z.string().optional().default("cr_default"),
  currency: z.enum(["USD", "INR"]).optional().default("USD"),
});

export type CreatorAnalyticsQuery = z.infer<typeof CreatorAnalyticsQuerySchema>;

export interface EarningsVelocityPoint {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Oct 24"
  tasksCompleted: number;
  grossGmvUsd: number;
  grossGmvInr: number;
  netEarningsUsd: number;
  netEarningsInr: number;
  tokenCostUsd: number;
  tokenCostInr: number;
}

export interface TokenCostTelemetry {
  totalTokensProcessed: number;
  blendedCostPer1kTokensUsd: number;
  blendedCostPer1kTokensInr: number;
  totalTokenCostUsd: number;
  totalTokenCostInr: number;
  grossMarginPercent: number; // e.g. 96.2%
  promptCachingHitRatePercent: number; // e.g. 43.6%
  avgTokensPerExecution: number;
  llmAssistedRatioPercent: number;
  deterministicRatioPercent: number;
}

export interface PayoutLedgerItem {
  id: string;
  transactionHash: string;
  method: "UPI" | "BANK_TRANSFER" | "STRIPE";
  rail: string;
  destinationAccount: string;
  amountUsd: number;
  amountInr: number;
  feeUsd: number;
  feeInr: number;
  status: "SETTLED" | "PENDING" | "PROCESSING";
  timestamp: string;
  settlementReceiptHash: string;
}

export interface TopEarningAgent {
  id: string;
  slug: string;
  name: string;
  category: string;
  taskVolume30d: number;
  pricePerTaskUsd: number;
  pricePerTaskInr: number;
  grossGmvUsd: number;
  grossGmvInr: number;
  netEarningsUsd: number; // 85%
  netEarningsInr: number; // 85%
  platformFeeUsd: number; // 15%
  platformFeeInr: number; // 15%
  tokenCostUsd: number;
  tokenCostInr: number;
  marginPercent: number;
  successRate: number;
  avgLatencyMs: number;
  status: "ACTIVE" | "PAUSED" | "DRAFT";
}

export interface CreatorFinancialSummary {
  grossGmvUsd: number;
  grossGmvInr: number;
  netEarningsUsd: number; // 85%
  netEarningsInr: number; // 85%
  platformFeeUsd: number; // 15%
  platformFeeInr: number; // 15%
  availablePayoutUsd: number;
  availablePayoutInr: number;
  pendingEscrowUsd: number;
  pendingEscrowInr: number;
  lifetimeEarningsUsd: number;
  lifetimeEarningsInr: number;
  totalTasksCompleted: number;
  activeAgentsCount: number;
  blendedSuccessRate: number;
}

export interface CreatorAnalyticsTelemetry {
  summary: CreatorFinancialSummary;
  velocity: {
    points: EarningsVelocityPoint[];
    velocity7dGrowthPercent: number;
    velocityAverageDailyGrossUsd: number;
    peakDayUsd: number;
  };
  tokenMargins: TokenCostTelemetry;
  payouts: {
    activeRequests: PayoutLedgerItem[];
    settledHistory: PayoutLedgerItem[];
    totalSettledUsd: number;
    totalSettledInr: number;
    totalPendingUsd: number;
    totalPendingInr: number;
  };
  topAgents: TopEarningAgent[];
  meta: {
    calculatedAt: string;
    settlementRailStandard: string;
    dualRailExchangeRate: number; // 1 USD = 80 INR
  };
}

const EXCHANGE_RATE = 80;

/**
 * Baseline creator agents for analytics telemetry.
 */
const BASE_CREATOR_AGENTS = [
  {
    id: "cr-agent-001",
    slug: "erp-invoice-reconciliation-specialist",
    name: "ERP Invoice Reconciliation Specialist",
    category: "Finance",
    taskVolume30d: 1420,
    pricePerTaskUsd: 2.5,
    pricePerTaskInr: 200,
    successRate: 99.93,
    avgLatencyMs: 245,
    tokensPerTask: 1950,
    status: "ACTIVE" as const,
  },
  {
    id: "cr-agent-002",
    slug: "sox-audit-trail-verifier",
    name: "SOX Audit Trail Verifier",
    category: "Finance",
    taskVolume30d: 840,
    pricePerTaskUsd: 4.0,
    pricePerTaskInr: 320,
    successRate: 99.88,
    avgLatencyMs: 310,
    tokensPerTask: 2450,
    status: "ACTIVE" as const,
  },
  {
    id: "cr-agent-003",
    slug: "solidity-reentrancy-sentinel",
    name: "Solidity Reentrancy Sentinel",
    category: "DevOps",
    taskVolume30d: 610,
    pricePerTaskUsd: 5.0,
    pricePerTaskInr: 400,
    successRate: 100.0,
    avgLatencyMs: 185,
    tokensPerTask: 1620,
    status: "ACTIVE" as const,
  },
  {
    id: "cr-agent-004",
    slug: "saas-msa-liability-scanner",
    name: "SaaS MSA Liability Cap Scanner",
    category: "Legal",
    taskVolume30d: 110,
    pricePerTaskUsd: 3.5,
    pricePerTaskInr: 280,
    successRate: 98.8,
    avgLatencyMs: 420,
    tokensPerTask: 3200,
    status: "PAUSED" as const,
  },
];

/**
 * Historical and active payout ledger records.
 */
const BASE_PAYOUT_LEDGER: PayoutLedgerItem[] = [
  {
    id: "po-rec-904",
    transactionHash: "tx_0xPendingEscrowRail7a21f",
    method: "UPI",
    rail: "UPI Instant (NPCI VPA)",
    destinationAccount: "jordan.creator@hdfcbank",
    amountUsd: 650.0,
    amountInr: 52000,
    feeUsd: 0,
    feeInr: 0,
    status: "PENDING",
    timestamp: "2026-10-30T22:15:00Z",
    settlementReceiptHash:
      "f5a289b413c68a48792015e1bc9785461942ef3a726359bc719003841029da1b",
  },
  {
    id: "po-rec-901",
    transactionHash: "tx_0x9b41efc82138aa591b72e104f3299a",
    method: "UPI",
    rail: "UPI Instant (NPCI VPA)",
    destinationAccount: "jordan.creator@hdfcbank",
    amountUsd: 2500.0,
    amountInr: 200000,
    feeUsd: 0,
    feeInr: 0,
    status: "SETTLED",
    timestamp: "2026-10-24T18:32:10Z",
    settlementReceiptHash:
      "3a4d8efc9102837461928374a5b6c7d8e9f0123456789abcdef0123456789abc",
  },
  {
    id: "po-rec-902",
    transactionHash: "tx_0x3e18a09cf1b7829910a5e427189bce",
    method: "STRIPE",
    rail: "Stripe Direct Connect",
    destinationAccount: "acct_1N9x4bL8K90vZmYq (USD Checking)",
    amountUsd: 3200.0,
    amountInr: 256000,
    feeUsd: 8.0,
    feeInr: 640,
    status: "SETTLED",
    timestamp: "2026-10-15T11:14:02Z",
    settlementReceiptHash:
      "8b2a1c9d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef",
  },
  {
    id: "po-rec-903",
    transactionHash: "tx_0x77c9d123e4f5091a998bb3c129e011",
    method: "BANK_TRANSFER",
    rail: "NEFT / RTGS Bank Wire",
    destinationAccount: "HDFC0001829 - AC **8402",
    amountUsd: 1850.0,
    amountInr: 148000,
    feeUsd: 0,
    feeInr: 0,
    status: "SETTLED",
    timestamp: "2026-09-30T16:45:55Z",
    settlementReceiptHash:
      "1f2e3d4c5b6a7980918273645e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f",
  },
];

/**
 * Computes deterministic daily earnings velocity points over 30 days.
 */
function generate30DayVelocity(): EarningsVelocityPoint[] {
  const points: EarningsVelocityPoint[] = [];
  const baseDate = new Date("2026-10-31T00:00:00Z");

  // Calibrated daily distributions
  const dailyTasksDistribution = [
    78, 85, 92, 104, 88, 96, 112, 105, 98, 115, 122, 118, 108, 130, 125,
    114, 120, 134, 142, 138, 126, 145, 150, 140, 135, 148, 156, 162, 158, 166,
  ];

  const avgPriceUsd = 3.25;
  const tokenCostPerTaskUsd = 0.0036;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const day = d.getUTCDate();
    const dayLabel = `${month} ${day}`;

    const taskCount = dailyTasksDistribution[29 - i] || 110;
    const grossGmvUsd = Number((taskCount * avgPriceUsd).toFixed(2));
    const grossGmvInr = Math.round(grossGmvUsd * EXCHANGE_RATE);

    const netEarningsUsd = Number((grossGmvUsd * 0.85).toFixed(2));
    const netEarningsInr = Math.round(netEarningsUsd * EXCHANGE_RATE);

    const tokenCostUsd = Number((taskCount * tokenCostPerTaskUsd).toFixed(2));
    const tokenCostInr = Number((tokenCostUsd * EXCHANGE_RATE).toFixed(2));

    points.push({
      date: dateStr,
      dayLabel,
      tasksCompleted: taskCount,
      grossGmvUsd,
      grossGmvInr,
      netEarningsUsd,
      netEarningsInr,
      tokenCostUsd,
      tokenCostInr,
    });
  }

  return points;
}

/**
 * Computes full creator revenue telemetry.
 */
export function getCreatorAnalyticsTelemetry(
  options: Partial<CreatorAnalyticsQuery> = {}
): CreatorAnalyticsTelemetry {
  const allPoints = generate30DayVelocity();
  const timeframe = options.timeframe || "30d";
  const velocityPoints =
    timeframe === "7d" ? allPoints.slice(-7) : allPoints;

  // 1. Calculate top-earning agents telemetry
  let totalTasks = 0;
  let totalGrossUsd = 0;
  let totalGrossInr = 0;
  let totalNetUsd = 0;
  let totalNetInr = 0;
  let totalPlatformUsd = 0;
  let totalPlatformInr = 0;
  let totalTokensConsumed = 0;
  let totalTokenExpenseUsd = 0;

  const costPer1kTokensUsd = 0.0018;

  const topAgents: TopEarningAgent[] = BASE_CREATOR_AGENTS.map((agent) => {
    const grossUsd = Number((agent.taskVolume30d * agent.pricePerTaskUsd).toFixed(2));
    const grossInr = agent.taskVolume30d * agent.pricePerTaskInr;

    const netUsd = Number((grossUsd * 0.85).toFixed(2));
    const netInr = Math.round(grossInr * 0.85);

    const platformUsd = Number((grossUsd * 0.15).toFixed(2));
    const platformInr = grossInr - netInr;

    const agentTokens = agent.taskVolume30d * agent.tokensPerTask;
    const tokenCostUsd = Number(((agentTokens / 1000) * costPer1kTokensUsd).toFixed(2));
    const tokenCostInr = Number((tokenCostUsd * EXCHANGE_RATE).toFixed(2));

    const marginPercent = Number(
      (((netUsd - tokenCostUsd) / (netUsd || 1)) * 100).toFixed(1)
    );

    totalTasks += agent.taskVolume30d;
    totalGrossUsd += grossUsd;
    totalGrossInr += grossInr;
    totalNetUsd += netUsd;
    totalNetInr += netInr;
    totalPlatformUsd += platformUsd;
    totalPlatformInr += platformInr;
    totalTokensConsumed += agentTokens;
    totalTokenExpenseUsd += tokenCostUsd;

    return {
      id: agent.id,
      slug: agent.slug,
      name: agent.name,
      category: agent.category,
      taskVolume30d: agent.taskVolume30d,
      pricePerTaskUsd: agent.pricePerTaskUsd,
      pricePerTaskInr: agent.pricePerTaskInr,
      grossGmvUsd: grossUsd,
      grossGmvInr: grossInr,
      netEarningsUsd: netUsd,
      netEarningsInr: netInr,
      platformFeeUsd: platformUsd,
      platformFeeInr: platformInr,
      tokenCostUsd,
      tokenCostInr,
      marginPercent,
      successRate: agent.successRate,
      avgLatencyMs: agent.avgLatencyMs,
      status: agent.status,
    };
  });

  // Sort top agents by net earnings descending
  topAgents.sort((a, b) => b.netEarningsUsd - a.netEarningsUsd);

  // 2. Payouts ledger aggregation
  const activeRequests = BASE_PAYOUT_LEDGER.filter((p) => p.status !== "SETTLED");
  const settledHistory = BASE_PAYOUT_LEDGER.filter((p) => p.status === "SETTLED");

  let totalSettledUsd = 0;
  let totalSettledInr = 0;
  for (const item of settledHistory) {
    totalSettledUsd += item.amountUsd;
    totalSettledInr += item.amountInr;
  }

  let totalPendingUsd = 0;
  let totalPendingInr = 0;
  for (const item of activeRequests) {
    totalPendingUsd += item.amountUsd;
    totalPendingInr += item.amountInr;
  }

  // Current balance figures
  const availablePayoutUsd = 4250.0;
  const availablePayoutInr = Math.round(availablePayoutUsd * EXCHANGE_RATE);
  const pendingEscrowUsd = 850.0;
  const pendingEscrowInr = Math.round(pendingEscrowUsd * EXCHANGE_RATE);
  const lifetimeEarningsUsd = Number(
    (totalSettledUsd + availablePayoutUsd + pendingEscrowUsd).toFixed(2)
  );
  const lifetimeEarningsInr = Math.round(lifetimeEarningsUsd * EXCHANGE_RATE);

  // 3. Token margin efficiency
  const totalTokenCostInr = Number((totalTokenExpenseUsd * EXCHANGE_RATE).toFixed(2));
  const grossMarginPercent = Number(
    (((totalNetUsd - totalTokenExpenseUsd) / (totalNetUsd || 1)) * 100).toFixed(1)
  );

  const tokenMargins: TokenCostTelemetry = {
    totalTokensProcessed: totalTokensConsumed,
    blendedCostPer1kTokensUsd: costPer1kTokensUsd,
    blendedCostPer1kTokensInr: Number((costPer1kTokensUsd * EXCHANGE_RATE).toFixed(3)),
    totalTokenCostUsd: Number(totalTokenExpenseUsd.toFixed(2)),
    totalTokenCostInr,
    grossMarginPercent,
    promptCachingHitRatePercent: 44.8,
    avgTokensPerExecution: Math.round(totalTokensConsumed / (totalTasks || 1)),
    llmAssistedRatioPercent: 68.5,
    deterministicRatioPercent: 31.5,
  };

  // 4. Velocity metrics
  const last7Days = velocityPoints.slice(-7);
  const previous7Days = velocityPoints.slice(-14, -7);

  const sumGross7d = last7Days.reduce((acc, curr) => acc + curr.grossGmvUsd, 0);
  const prevGross7d = previous7Days.reduce((acc, curr) => acc + curr.grossGmvUsd, 0) || 1;
  const velocity7dGrowthPercent = Number(
    (((sumGross7d - prevGross7d) / prevGross7d) * 100).toFixed(1)
  );

  const velocityAverageDailyGrossUsd = Number((sumGross7d / 7).toFixed(2));
  const peakDayUsd = Math.max(...velocityPoints.map((p) => p.grossGmvUsd));

  return {
    summary: {
      grossGmvUsd: Number(totalGrossUsd.toFixed(2)),
      grossGmvInr: totalGrossInr,
      netEarningsUsd: Number(totalNetUsd.toFixed(2)),
      netEarningsInr: totalNetInr,
      platformFeeUsd: Number(totalPlatformUsd.toFixed(2)),
      platformFeeInr: totalPlatformInr,
      availablePayoutUsd,
      availablePayoutInr,
      pendingEscrowUsd,
      pendingEscrowInr,
      lifetimeEarningsUsd,
      lifetimeEarningsInr,
      totalTasksCompleted: totalTasks,
      activeAgentsCount: BASE_CREATOR_AGENTS.filter((a) => a.status === "ACTIVE").length,
      blendedSuccessRate: 99.89,
    },
    velocity: {
      points: velocityPoints,
      velocity7dGrowthPercent,
      velocityAverageDailyGrossUsd,
      peakDayUsd,
    },
    tokenMargins,
    payouts: {
      activeRequests,
      settledHistory,
      totalSettledUsd: Number(totalSettledUsd.toFixed(2)),
      totalSettledInr: totalSettledInr,
      totalPendingUsd: Number(totalPendingUsd.toFixed(2)),
      totalPendingInr: totalPendingInr,
    },
    topAgents,
    meta: {
      calculatedAt: "2026-10-31T08:00:00Z",
      settlementRailStandard: "ISO-20022-COMPLIANT-ESCROW-V2",
      dualRailExchangeRate: EXCHANGE_RATE,
    },
  };
}
