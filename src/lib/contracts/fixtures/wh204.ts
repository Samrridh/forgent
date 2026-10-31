import { WH204Truth, Job, AcceptanceContract } from "../domain";
import { DEMO_IDENTITIES } from "../constants";

export const CANONICAL_WH204_TRUTH: WH204Truth = {
  jobId: "job-wh-204",
  poQuantity: 12,
  invoiceQuantity: 12,
  scannedQuantity: 10,
  expectedReceived: 10,
  expectedDiscrepancy: 2,
  discrepancyType: "UNEXPLAINED_SHORTAGE",
  expectedOutcome: "EXCEPTION_REQUIRES_REVIEW",
  inventoryCommitStatus: "BLOCKED_PENDING_APPROVAL",
  initialInventoryOnHand: 42,
  expectedFinalInventoryOnHand: 42,
};

export const CANONICAL_WH204_CONTRACT: AcceptanceContract = {
  contractId: "contract-wh-204-v1",
  jobId: "job-wh-204",
  version: 1,
  checks: [
    { checkCode: "CHK-DOC-01", name: "PO Extraction", description: "PO quantity equals 12", required: true },
    { checkCode: "CHK-DOC-02", name: "Invoice Extraction", description: "Invoice quantity equals 12", required: true },
    { checkCode: "CHK-REC-01", name: "Receiving Extraction", description: "Receiving scan quantity equals 10", required: true },
    { checkCode: "CHK-REC-02", name: "Quantity Reconciliation", description: "10 received, 2 variance", required: true },
    { checkCode: "CHK-REC-03", name: "Discrepancy Attribution", description: "Unexplained shortage tagged", required: true },
    { checkCode: "CHK-POL-01", name: "Tolerance Policy", description: "Variance exceeds 5% threshold", required: true },
    { checkCode: "CHK-POL-02", name: "Workflow Outcome", description: "Outcome is EXCEPTION_REQUIRES_REVIEW", required: true },
    { checkCode: "CHK-EXC-01", name: "Exception Report", description: "Actionable summary generated", required: true },
    { checkCode: "CHK-INV-01", name: "Inventory Invariant", description: "42 -> 42 inventory on hand preserved", required: true },
    { checkCode: "CHK-HUM-01", name: "Human Approval Gate", description: "Commit blocked pending approval", required: true },
  ],
  requiredInventoryInvariant: {
    expectedInitialOnHand: 42,
    expectedFinalOnHand: 42,
    commitBlocked: true,
  },
  humanReviewRequired: true,
  discrepancyThresholdPercent: 5,
};

export const CANONICAL_WH204_JOB: Job = {
  jobId: "job-wh-204",
  buyerId: DEMO_IDENTITIES.BUYER_ID,
  title: "Inbound shipment reconciliation — WH-204",
  status: "CONTRACT_READY",
  budgetPaise: DEMO_IDENTITIES.TOTAL_BUDGET_PAISE,
  deadlineMinutes: 30,
  acceptanceContract: CANONICAL_WH204_CONTRACT,
  evidenceDocuments: [
    "evidence/po-8812.pdf",
    "evidence/invoice-inv-992.pdf",
    "evidence/scan-batch-01.json",
  ],
  createdAt: "2026-10-30T10:00:00.000Z",
  updatedAt: "2026-10-30T10:00:00.000Z",
};
