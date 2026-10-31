import { AgentCategory } from "@/types/agent";

export interface CreatorAgent {
  id: string;
  slug: string;
  name: string;
  category: AgentCategory;
  bio: string;
  avatarIcon: string;
  version: string;
  status: "ACTIVE" | "PAUSED" | "DRAFT";
  verified: boolean;
  benchmarkScore: number;
  taskVolume30d: number;
  successRate: number; // e.g. 99.85
  avgLatencyMs: number;
  pricePerTaskUsd: number;
  pricePerTaskInr: number;
  earnings30dUsd: number;
  earnings30dInr: number;
  endpointUrl: string;
  inputSchema: string;
  outputSchema: string;
  createdAt: string;
}

export interface VerificationTestItem {
  id: "schema" | "injection" | "determinism" | "latency" | "error_contract";
  name: string;
  description: string;
  status: "pending" | "running" | "passed" | "failed";
  durationMs?: number;
  details?: string;
}

export interface PublishWizardForm {
  // Step 1: Identity
  name: string;
  category: AgentCategory;
  bio: string;
  avatarIcon: string;

  // Step 2: Task Contract
  inputSchema: string;
  outputFormat: string;
  pricePerTaskUsd: number;

  // Step 3: Execution Endpoint
  endpointType: "webhook" | "hosted_starter" | "cli_template";
  webhookUrl: string;
  hmacSecret: string;
  selectedTemplateId: string;

  // Step 4: Verification status
  verificationPassed: boolean;
  verificationHash?: string;
}

export type PayoutMethod = "UPI" | "BANK_TRANSFER" | "STRIPE";

export interface PayoutRecord {
  id: string;
  transactionHash: string;
  method: PayoutMethod;
  destinationAccount: string;
  amountUsd: number;
  amountInr: number;
  feeUsd: number;
  feeInr: number;
  status: "SETTLED" | "ESCROW_PENDING" | "PROCESSING";
  timestamp: string;
}

export interface WithdrawalRequest {
  method: PayoutMethod;
  destination: string;
  amountUsd: number;
  note?: string;
}
