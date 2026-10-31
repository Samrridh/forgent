import { z } from "zod";

// ==========================================
// 1. Inbound Logistics Document Schemas
// ==========================================

export const PurchaseOrderItemSchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1),
  orderedQuantity: z.number().int().nonnegative(),
  unitCostPaise: z.number().int().nonnegative(),
  totalPaise: z.number().int().nonnegative(),
});
export type PurchaseOrderItem = z.infer<typeof PurchaseOrderItemSchema>;

export const PurchaseOrderDocumentSchema = z.object({
  poNumber: z.string().min(1),
  vendorId: z.string().min(1),
  vendorName: z.string().min(1),
  orderDate: z.string().min(1),
  currency: z.enum(["INR", "USD"]).default("INR"),
  items: z.array(PurchaseOrderItemSchema).min(1),
  totalAmountPaise: z.number().int().nonnegative(),
});
export type PurchaseOrderDocument = z.infer<typeof PurchaseOrderDocumentSchema>;

export const PackingSlipItemSchema = z.object({
  sku: z.string().min(1),
  shippedQuantity: z.number().int().nonnegative(),
  invoicedUnitCostPaise: z.number().int().nonnegative().optional(),
  lotNumber: z.string().optional(),
});
export type PackingSlipItem = z.infer<typeof PackingSlipItemSchema>;

export const PackingSlipDocumentSchema = z.object({
  slipNumber: z.string().min(1),
  poNumber: z.string().min(1),
  vendorId: z.string().min(1),
  vendorName: z.string().min(1),
  shipDate: z.string().min(1),
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  items: z.array(PackingSlipItemSchema).min(1),
});
export type PackingSlipDocument = z.infer<typeof PackingSlipDocumentSchema>;

export const ReceivingLogItemSchema = z.object({
  sku: z.string().min(1),
  receivedQuantity: z.number().int().nonnegative(),
  damagedQuantity: z.number().int().nonnegative().default(0),
  conditionNotes: z.string().optional(),
  barcode: z.string().optional(),
  inspectedAt: z.string().optional(),
});
export type ReceivingLogItem = z.infer<typeof ReceivingLogItemSchema>;

export const ReceivingLogDocumentSchema = z.object({
  receivingId: z.string().min(1),
  warehouseId: z.string().min(1),
  warehouseName: z.string().min(1),
  inspectorName: z.string().min(1),
  scanDate: z.string().min(1),
  dockDoor: z.string().optional(),
  items: z.array(ReceivingLogItemSchema).min(1),
});
export type ReceivingLogDocument = z.infer<typeof ReceivingLogDocumentSchema>;

export const ReceivingDocumentBundleSchema = z.object({
  purchaseOrder: PurchaseOrderDocumentSchema,
  packingSlip: PackingSlipDocumentSchema,
  receivingLog: ReceivingLogDocumentSchema,
});
export type ReceivingDocumentBundle = z.infer<typeof ReceivingDocumentBundleSchema>;

// ==========================================
// 2. Reconciliation & 3-Way Match Schemas
// ==========================================

export const MatchStatusSchema = z.enum([
  "PERFECT_MATCH",
  "SHORT_SHIPMENT",
  "OVER_SHIPMENT",
  "PRICE_VARIANCE",
  "DAMAGED_GOODS",
  "DISCREPANCY_REQUIRES_REVIEW",
]);
export type MatchStatus = z.infer<typeof MatchStatusSchema>;

export const ItemReconciliationMatchSchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1),
  orderedQuantity: z.number().int().nonnegative(),
  shippedQuantity: z.number().int().nonnegative(),
  physicallyReceivedQuantity: z.number().int().nonnegative(),
  damagedQuantity: z.number().int().nonnegative(),
  acceptedQuantity: z.number().int().nonnegative(),
  quantityDiscrepancy: z.number().int(), // accepted - ordered
  poUnitCostPaise: z.number().int().nonnegative(),
  invoicedUnitCostPaise: z.number().int().nonnegative(),
  unitCostVariancePaise: z.number().int(),
  unitCostVariancePercent: z.number(), // e.g. 4.44
  status: MatchStatusSchema,
  varianceNotes: z.array(z.string()),
});
export type ItemReconciliationMatch = z.infer<typeof ItemReconciliationMatchSchema>;

export const ReconciliationResultSchema = z.object({
  reconciliationId: z.string().min(1),
  reconciledAt: z.string().min(1),
  vendorId: z.string().min(1),
  poNumber: z.string().min(1),
  totalSkus: z.number().int().nonnegative(),
  perfectMatchCount: z.number().int().nonnegative(),
  discrepancyCount: z.number().int().nonnegative(),
  totalOrderedQuantity: z.number().int().nonnegative(),
  totalShippedQuantity: z.number().int().nonnegative(),
  totalReceivedQuantity: z.number().int().nonnegative(),
  totalDamagedQuantity: z.number().int().nonnegative(),
  totalAcceptedQuantity: z.number().int().nonnegative(),
  maxPriceVariancePercent: z.number(),
  hasDamagedGoods: z.boolean(),
  hasPriceVarianceOverTolerance: z.boolean(), // > 2.0%
  requiresHumanCheckpoint: z.boolean(),
  checkpointReason: z.string().optional(),
  itemMatches: z.array(ItemReconciliationMatchSchema),
});
export type ReconciliationResult = z.infer<typeof ReconciliationResultSchema>;

// ==========================================
// 3. Exception Reporting & Credit Memos
// ==========================================

export const ExceptionSeveritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type ExceptionSeverity = z.infer<typeof ExceptionSeveritySchema>;

export const DiscrepancyTypeSchema = z.enum([
  "SHORT_SHIPMENT",
  "DAMAGED_GOODS",
  "PRICE_DRIFT_EXCEEDED",
  "OVER_SHIPMENT",
  "BARCODE_UNREGISTERED",
]);
export type DiscrepancyType = z.infer<typeof DiscrepancyTypeSchema>;

export const EvidenceCitationSchema = z.object({
  sourceDocument: z.enum(["PURCHASE_ORDER", "PACKING_SLIP", "RECEIVING_LOG"]),
  documentReference: z.string(),
  field: z.string(),
  recordedValue: z.union([z.string(), z.number()]),
  expectedValue: z.union([z.string(), z.number()]),
});
export type EvidenceCitation = z.infer<typeof EvidenceCitationSchema>;

export const ExceptionItemSchema = z.object({
  exceptionId: z.string().min(1),
  sku: z.string().min(1),
  type: DiscrepancyTypeSchema,
  severity: ExceptionSeveritySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  evidence: z.array(EvidenceCitationSchema),
  financialImpactPaise: z.number().int().nonnegative(),
  recommendedCreditMemoPaise: z.number().int().nonnegative(),
});
export type ExceptionItem = z.infer<typeof ExceptionItemSchema>;

export const ExceptionReportSchema = z.object({
  reportId: z.string().min(1),
  generatedAt: z.string().min(1),
  poNumber: z.string().min(1),
  vendorName: z.string().min(1),
  totalExceptions: z.number().int().nonnegative(),
  totalFinancialImpactPaise: z.number().int().nonnegative(),
  totalCreditMemoRecommendedPaise: z.number().int().nonnegative(),
  items: z.array(ExceptionItemSchema),
  executiveSummaryMarkdown: z.string().min(1),
});
export type ExceptionReport = z.infer<typeof ExceptionReportSchema>;

// ==========================================
// 4. ERP Inventory State & State Diff
// ==========================================

export const ErpBaselineItemSchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1),
  currentOnHand: z.number().int().nonnegative(),
  unitCostPaise: z.number().int().nonnegative(),
  totalValuationPaise: z.number().int().nonnegative(),
  locationCode: z.string().default("MAIN-WH-01"),
});
export type ErpBaselineItem = z.infer<typeof ErpBaselineItemSchema>;

export const ErpItemStateDiffSchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1),
  beforeOnHand: z.number().int().nonnegative(),
  afterOnHand: z.number().int().nonnegative(),
  onHandDelta: z.number().int(),
  beforeUnitCostPaise: z.number().int().nonnegative(),
  afterUnitCostPaise: z.number().int().nonnegative(),
  unitCostDeltaPaise: z.number().int(),
  beforeValuationPaise: z.number().int().nonnegative(),
  afterValuationPaise: z.number().int().nonnegative(),
  valuationDeltaPaise: z.number().int(),
  pendingInvoiceCreditPaise: z.number().int().nonnegative(),
  status: z.enum(["COMMITTED", "HELD_PENDING_APPROVAL", "REJECTED"]),
});
export type ErpItemStateDiff = z.infer<typeof ErpItemStateDiffSchema>;

export const ErpStateDiffSchema = z.object({
  diffId: z.string().min(1),
  generatedAt: z.string().min(1),
  warehouseId: z.string().min(1),
  items: z.array(ErpItemStateDiffSchema),
  netOnHandDelta: z.number().int(),
  netValuationDeltaPaise: z.number().int(),
  totalPendingCreditPaise: z.number().int().nonnegative(),
  commitStatus: z.enum(["AUTO_COMMITTED", "PENDING_HUMAN_CHECKPOINT", "MANUALLY_OVERRIDDEN"]),
});
export type ErpStateDiff = z.infer<typeof ErpStateDiffSchema>;

// ==========================================
// 5. Human-In-The-Loop Checkpoint
// ==========================================

export const CheckpointTriggerTypeSchema = z.enum([
  "PRICE_VARIANCE_EXCEEDED",
  "DAMAGED_GOODS_DETECTED",
  "QUANTITY_SHORTAGE_SEVERE",
]);
export type CheckpointTriggerType = z.infer<typeof CheckpointTriggerTypeSchema>;

export const CheckpointResolutionActionSchema = z.enum([
  "APPROVE_WITH_CREDIT_MEMO",
  "ACCEPT_PRICE_DRIFT",
  "REJECT_SHIPMENT",
  "MANUAL_QUANTITY_OVERRIDE",
]);
export type CheckpointResolutionAction = z.infer<typeof CheckpointResolutionActionSchema>;

export const CheckpointResolutionSchema = z.object({
  action: CheckpointResolutionActionSchema,
  reviewerName: z.string().min(1),
  notes: z.string().min(1),
  resolvedAt: z.string().min(1),
  authorizedCreditMemoPaise: z.number().int().nonnegative().optional(),
  overrideAcceptedQuantity: z.number().int().nonnegative().optional(),
});
export type CheckpointResolution = z.infer<typeof CheckpointResolutionSchema>;

export const HumanCheckpointSchema = z.object({
  checkpointId: z.string().min(1),
  createdAt: z.string().min(1),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ADJUSTED"]),
  reason: z.string().min(1),
  triggers: z.array(
    z.object({
      type: CheckpointTriggerTypeSchema,
      threshold: z.string(),
      observed: z.string(),
      description: z.string(),
    })
  ),
  priceVariancePercent: z.number(),
  damagedQuantity: z.number().int().nonnegative(),
  shortQuantity: z.number().int().nonnegative(),
  financialExposurePaise: z.number().int().nonnegative(),
  resolution: CheckpointResolutionSchema.optional(),
});
export type HumanCheckpoint = z.infer<typeof HumanCheckpointSchema>;

// ==========================================
// 6. Cryptographic Evidence Receipt
// ==========================================

export const ReceivingPipelineStageRecordSchema = z.object({
  stage: z.enum(["EVIDENCE_READER", "RECONCILIATION_SPECIALIST", "EXCEPTION_REPORTER"]),
  agentName: z.string(),
  builderId: z.string(),
  status: z.enum(["COMPLETED", "FAILED", "SKIPPED"]),
  latencyMs: z.number().int().nonnegative(),
  sha256Digest: z.string().length(64),
  summary: z.string(),
});
export type ReceivingPipelineStageRecord = z.infer<typeof ReceivingPipelineStageRecordSchema>;

export const SealedReceivingReceiptSchema = z.object({
  receiptId: z.string().min(1),
  sha256Hash: z.string().length(64),
  inputHash: z.string().length(64),
  issuedAt: z.string().min(1),
  algorithm: z.literal("SHA256:CANONICAL_JSON"),
  sealedBy: z.string().min(1),
  poNumber: z.string().min(1),
  vendorId: z.string().min(1),
  warehouseId: z.string().min(1),
  stages: z.array(ReceivingPipelineStageRecordSchema),
  reconciliationDigest: z.string().length(64),
  stateDiffDigest: z.string().length(64),
  checkpointDigest: z.string().length(64).optional(),
});
export type SealedReceivingReceipt = z.infer<typeof SealedReceivingReceiptSchema>;

// ==========================================
// 7. Full Execution Result & Curated Scenario
// ==========================================

export const ReceivingExecutionResultSchema = z.object({
  executionId: z.string().min(1),
  startedAt: z.string().min(1),
  completedAt: z.string().min(1),
  totalDurationMs: z.number().int().nonnegative(),
  extractedDocuments: ReceivingDocumentBundleSchema,
  reconciliation: ReconciliationResultSchema,
  exceptionReport: ExceptionReportSchema,
  erpStateDiff: ErpStateDiffSchema,
  checkpoint: HumanCheckpointSchema.optional(),
  sealedReceipt: SealedReceivingReceiptSchema,
});
export type ReceivingExecutionResult = z.infer<typeof ReceivingExecutionResultSchema>;

export interface ReceivingScenario {
  id: string;
  name: string;
  industry: string;
  skuCategory: string;
  badge: string;
  description: string;
  expectedOutcome: string;
  documents: ReceivingDocumentBundle;
  erpBaseline: ErpBaselineItem[];
}
