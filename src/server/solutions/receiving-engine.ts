import {
  ReceivingDocumentBundle,
  ReceivingDocumentBundleSchema,
  ReconciliationResult,
  ItemReconciliationMatch,
  MatchStatus,
  ExceptionReport,
  ExceptionItem,
  ErpBaselineItem,
  CheckpointResolution,
  ReceivingPipelineStageRecord,
  ReceivingExecutionResult,
} from "@/lib/contracts/receiving-types";
import { computeSha256, sealReceivingReceipt } from "./receiving-receipt";
import {
  computeErpStateDiff,
  evaluateHumanCheckpoint,
  resolveHumanCheckpoint,
} from "./receiving-state-diff";

export { computeSha256, sealReceivingReceipt, verifyReceivingReceipt } from "./receiving-receipt";
export {
  computeErpStateDiff,
  evaluateHumanCheckpoint,
  resolveHumanCheckpoint,
} from "./receiving-state-diff";

// ==========================================
// Stage 1: Evidence Reader Agent
// ==========================================

export interface EvidenceReaderOutput {
  bundle: ReceivingDocumentBundle;
  extractedLineItemsCount: number;
  metadata: {
    vendorName: string;
    poNumber: string;
    slipNumber: string;
    receivingId: string;
    warehouseId: string;
    currency: string;
  };
}

export function runEvidenceReaderStage(rawInput: ReceivingDocumentBundle): {
  data: EvidenceReaderOutput;
  digest: string;
  durationMs: number;
} {
  const start = Date.now();
  const bundle = ReceivingDocumentBundleSchema.parse(rawInput);

  const totalLines =
    bundle.purchaseOrder.items.length +
    bundle.packingSlip.items.length +
    bundle.receivingLog.items.length;

  const data: EvidenceReaderOutput = {
    bundle,
    extractedLineItemsCount: totalLines,
    metadata: {
      vendorName: bundle.purchaseOrder.vendorName,
      poNumber: bundle.purchaseOrder.poNumber,
      slipNumber: bundle.packingSlip.slipNumber,
      receivingId: bundle.receivingLog.receivingId,
      warehouseId: bundle.receivingLog.warehouseId,
      currency: bundle.purchaseOrder.currency,
    },
  };

  const digest = computeSha256(data);
  const durationMs = Date.now() - start;

  return { data, digest, durationMs };
}

// ==========================================
// Stage 2: Reconciliation Specialist Agent
// ==========================================

export function runReconciliationSpecialistStage(
  bundle: ReceivingDocumentBundle,
  toleranceConfig: { maxPriceVarianceTolerancePercent?: number } = {}
): {
  reconciliation: ReconciliationResult;
  digest: string;
  durationMs: number;
} {
  const start = Date.now();
  const maxPriceVarianceTolerance = toleranceConfig.maxPriceVarianceTolerancePercent ?? 2.0;

  const poItemsMap = new Map(bundle.purchaseOrder.items.map((i) => [i.sku, i]));
  const packingItemsMap = new Map(bundle.packingSlip.items.map((i) => [i.sku, i]));
  const receivingItemsMap = new Map(bundle.receivingLog.items.map((i) => [i.sku, i]));

  const allSkus = Array.from(
    new Set([
      ...bundle.purchaseOrder.items.map((i) => i.sku),
      ...bundle.packingSlip.items.map((i) => i.sku),
      ...bundle.receivingLog.items.map((i) => i.sku),
    ])
  );

  const itemMatches: ItemReconciliationMatch[] = [];
  let totalOrdered = 0;
  let totalShipped = 0;
  let totalReceived = 0;
  let totalDamaged = 0;
  let totalAccepted = 0;
  let perfectMatchCount = 0;
  let discrepancyCount = 0;
  let maxObservedPriceVariancePercent = 0;
  let hasDamage = false;
  let hasPriceVarianceOverTolerance = false;
  const checkpointReasons: string[] = [];

  for (const sku of allSkus) {
    const po = poItemsMap.get(sku);
    const packing = packingItemsMap.get(sku);
    const recv = receivingItemsMap.get(sku);

    const orderedQty = po?.orderedQuantity ?? 0;
    const shippedQty = packing?.shippedQuantity ?? 0;
    const receivedQty = recv?.receivedQuantity ?? 0;
    const damagedQty = recv?.damagedQuantity ?? 0;
    const acceptedQty = Math.max(0, receivedQty - damagedQty);

    totalOrdered += orderedQty;
    totalShipped += shippedQty;
    totalReceived += receivedQty;
    totalDamaged += damagedQty;
    totalAccepted += acceptedQty;

    const poCost = po?.unitCostPaise ?? 0;
    const invoicedCost = packing?.invoicedUnitCostPaise ?? poCost;
    const unitCostVariancePaise = invoicedCost - poCost;
    const unitCostVariancePercent =
      poCost > 0
        ? Number((((invoicedCost - poCost) / poCost) * 100).toFixed(2))
        : 0;

    if (Math.abs(unitCostVariancePercent) > maxObservedPriceVariancePercent) {
      maxObservedPriceVariancePercent = Math.abs(unitCostVariancePercent);
    }

    const varianceNotes: string[] = [];
    let status: MatchStatus = "PERFECT_MATCH";

    if (damagedQty > 0) {
      hasDamage = true;
      varianceNotes.push(`Physical damage detected: ${damagedQty} units damaged or non-conforming`);
      status = "DAMAGED_GOODS";
    }

    if (receivedQty < orderedQty) {
      const shortQty = orderedQty - receivedQty;
      varianceNotes.push(`Short shipment detected: ${shortQty} units missing from inbound delivery`);
      status = "SHORT_SHIPMENT";
    } else if (receivedQty > orderedQty) {
      const overQty = receivedQty - orderedQty;
      varianceNotes.push(`Over shipment detected: ${overQty} surplus units received`);
      status = "OVER_SHIPMENT";
    }

    if (Math.abs(unitCostVariancePercent) > 0.001) {
      varianceNotes.push(
        `Unit cost variance of ${unitCostVariancePercent > 0 ? "+" : ""}${unitCostVariancePercent}% (PO: ₹${(
          poCost / 100
        ).toFixed(2)}, Invoiced: ₹${(invoicedCost / 100).toFixed(2)})`
      );
      if (Math.abs(unitCostVariancePercent) > maxPriceVarianceTolerance) {
        hasPriceVarianceOverTolerance = true;
        checkpointReasons.push(
          `Unit cost drift of ${unitCostVariancePercent}% on SKU ${sku} exceeds maximum allowed policy threshold of ${maxPriceVarianceTolerance}%.`
        );
      }
      if (status === "PERFECT_MATCH") {
        status = "PRICE_VARIANCE";
      }
    }

    if (damagedQty > 0 && Math.abs(unitCostVariancePercent) > maxPriceVarianceTolerance) {
      status = "DISCREPANCY_REQUIRES_REVIEW";
    }

    if (status === "PERFECT_MATCH") {
      perfectMatchCount++;
    } else {
      discrepancyCount++;
    }

    itemMatches.push({
      sku,
      description: po?.description || `SKU ${sku}`,
      orderedQuantity: orderedQty,
      shippedQuantity: shippedQty,
      physicallyReceivedQuantity: receivedQty,
      damagedQuantity: damagedQty,
      acceptedQuantity: acceptedQty,
      quantityDiscrepancy: acceptedQty - orderedQty,
      poUnitCostPaise: poCost,
      invoicedUnitCostPaise: invoicedCost,
      unitCostVariancePaise,
      unitCostVariancePercent,
      status,
      varianceNotes,
    });
  }

  const requiresHumanCheckpoint = hasDamage || hasPriceVarianceOverTolerance;
  if (hasDamage) {
    checkpointReasons.unshift(`Damaged goods reported during physical receiving inspection (${totalDamaged} units).`);
  }

  const reconciliation: ReconciliationResult = {
    reconciliationId: `rec_${computeSha256({ po: bundle.purchaseOrder.poNumber, itemMatches }).slice(0, 12)}`,
    reconciledAt: new Date().toISOString(),
    vendorId: bundle.purchaseOrder.vendorId,
    poNumber: bundle.purchaseOrder.poNumber,
    totalSkus: allSkus.length,
    perfectMatchCount,
    discrepancyCount,
    totalOrderedQuantity: totalOrdered,
    totalShippedQuantity: totalShipped,
    totalReceivedQuantity: totalReceived,
    totalDamagedQuantity: totalDamaged,
    totalAcceptedQuantity: totalAccepted,
    maxPriceVariancePercent: maxObservedPriceVariancePercent,
    hasDamagedGoods: hasDamage,
    hasPriceVarianceOverTolerance,
    requiresHumanCheckpoint,
    checkpointReason: checkpointReasons.length > 0 ? checkpointReasons.join(" ") : undefined,
    itemMatches,
  };

  const digest = computeSha256(reconciliation);
  const durationMs = Date.now() - start;

  return { reconciliation, digest, durationMs };
}

// ==========================================
// Stage 3: Exception Reporter Agent
// ==========================================

export function runExceptionReporterStage(
  bundle: ReceivingDocumentBundle,
  reconciliation: ReconciliationResult
): {
  report: ExceptionReport;
  digest: string;
  durationMs: number;
} {
  const start = Date.now();
  const exceptions: ExceptionItem[] = [];
  let totalFinancialImpactPaise = 0;
  let totalCreditMemoRecommendedPaise = 0;

  for (const match of reconciliation.itemMatches) {
    // 1. Short shipment check
    if (match.physicallyReceivedQuantity < match.orderedQuantity) {
      const shortCount = match.orderedQuantity - match.physicallyReceivedQuantity;
      const creditPaise = shortCount * match.invoicedUnitCostPaise;
      totalFinancialImpactPaise += creditPaise;
      totalCreditMemoRecommendedPaise += creditPaise;

      exceptions.push({
        exceptionId: `exp_short_${match.sku.toLowerCase()}`,
        sku: match.sku,
        type: "SHORT_SHIPMENT",
        severity: shortCount > 5 ? "HIGH" : "MEDIUM",
        title: `Short Shipment: ${shortCount} units missing`,
        description: `Physical count of ${match.physicallyReceivedQuantity} units is lower than PO expected quantity of ${match.orderedQuantity} units. Packing slip indicated ${match.shippedQuantity} units shipped.`,
        evidence: [
          {
            sourceDocument: "PURCHASE_ORDER",
            documentReference: bundle.purchaseOrder.poNumber,
            field: "orderedQuantity",
            recordedValue: match.orderedQuantity,
            expectedValue: match.orderedQuantity,
          },
          {
            sourceDocument: "PACKING_SLIP",
            documentReference: bundle.packingSlip.slipNumber,
            field: "shippedQuantity",
            recordedValue: match.shippedQuantity,
            expectedValue: match.orderedQuantity,
          },
          {
            sourceDocument: "RECEIVING_LOG",
            documentReference: bundle.receivingLog.receivingId,
            field: "receivedQuantity",
            recordedValue: match.physicallyReceivedQuantity,
            expectedValue: match.orderedQuantity,
          },
        ],
        financialImpactPaise: creditPaise,
        recommendedCreditMemoPaise: creditPaise,
      });
    }

    // 2. Damaged goods check
    if (match.damagedQuantity > 0) {
      const damageCreditPaise = match.damagedQuantity * match.invoicedUnitCostPaise;
      totalFinancialImpactPaise += damageCreditPaise;
      totalCreditMemoRecommendedPaise += damageCreditPaise;

      exceptions.push({
        exceptionId: `exp_dmg_${match.sku.toLowerCase()}`,
        sku: match.sku,
        type: "DAMAGED_GOODS",
        severity: "CRITICAL",
        title: `Damaged Goods: ${match.damagedQuantity} units failed inspection`,
        description: `Warehouse receiving inspection flagged ${match.damagedQuantity} units with physical defect or damage. Goods rejected from inventory acceptance.`,
        evidence: [
          {
            sourceDocument: "RECEIVING_LOG",
            documentReference: bundle.receivingLog.receivingId,
            field: "damagedQuantity",
            recordedValue: match.damagedQuantity,
            expectedValue: 0,
          },
        ],
        financialImpactPaise: damageCreditPaise,
        recommendedCreditMemoPaise: damageCreditPaise,
      });
    }

    // 3. Price drift check
    if (Math.abs(match.unitCostVariancePercent) > 2.0) {
      const invoicedUnits = match.shippedQuantity;
      const unitDriftPaise = match.unitCostVariancePaise;
      const totalDriftPaise = Math.max(0, unitDriftPaise * invoicedUnits);
      totalFinancialImpactPaise += totalDriftPaise;
      totalCreditMemoRecommendedPaise += totalDriftPaise;

      exceptions.push({
        exceptionId: `exp_price_${match.sku.toLowerCase()}`,
        sku: match.sku,
        type: "PRICE_DRIFT_EXCEEDED",
        severity: "HIGH",
        title: `Unit Cost Drift: ${match.unitCostVariancePercent > 0 ? "+" : ""}${match.unitCostVariancePercent}% variance`,
        description: `Invoiced unit price (₹${(match.invoicedUnitCostPaise / 100).toFixed(2)}) drifts from authorized purchase order rate (₹${(match.poUnitCostPaise / 100).toFixed(2)}) by ${match.unitCostVariancePercent}%, exceeding the 2.0% enterprise policy limit.`,
        evidence: [
          {
            sourceDocument: "PURCHASE_ORDER",
            documentReference: bundle.purchaseOrder.poNumber,
            field: "unitCostPaise",
            recordedValue: match.poUnitCostPaise,
            expectedValue: match.poUnitCostPaise,
          },
          {
            sourceDocument: "PACKING_SLIP",
            documentReference: bundle.packingSlip.slipNumber,
            field: "invoicedUnitCostPaise",
            recordedValue: match.invoicedUnitCostPaise,
            expectedValue: match.poUnitCostPaise,
          },
        ],
        financialImpactPaise: totalDriftPaise,
        recommendedCreditMemoPaise: totalDriftPaise,
      });
    }
  }

  const executiveSummaryMarkdown = [
    `# Inbound Receiving Reconciliation & Exception Report`,
    `**Vendor**: ${bundle.purchaseOrder.vendorName} (${bundle.purchaseOrder.vendorId})  `,
    `**Purchase Order**: ${bundle.purchaseOrder.poNumber} | **Packing Slip**: ${bundle.packingSlip.slipNumber}  `,
    `**Inspection Run**: ${bundle.receivingLog.receivingId} @ ${bundle.receivingLog.warehouseName}  `,
    ``,
    `### Reconciliation Overview`,
    `- Total SKUs Inspected: **${reconciliation.totalSkus}**`,
    `- Clean 3-Way Matches: **${reconciliation.perfectMatchCount}**`,
    `- Discrepant Lines: **${reconciliation.discrepancyCount}**`,
    `- Total Units Ordered: **${reconciliation.totalOrderedQuantity}** | Physically Received: **${reconciliation.totalReceivedQuantity}** | Accepted: **${reconciliation.totalAcceptedQuantity}**`,
    reconciliation.totalDamagedQuantity > 0
      ? `- Damaged / Non-conforming Units: **${reconciliation.totalDamagedQuantity}**`
      : null,
    reconciliation.maxPriceVariancePercent > 0
      ? `- Maximum Unit Price Variance: **${reconciliation.maxPriceVariancePercent.toFixed(2)}%**`
      : null,
    `- Total Recommended Credit Memo: **₹${(totalCreditMemoRecommendedPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}**`,
    ``,
    `### Discrepancy Findings`,
    exceptions.length === 0
      ? `No discrepancies detected. Inbound shipment verified 100% compliant with purchase order and warehouse inspection specifications.`
      : exceptions
          .map(
            (e, i) =>
              `${i + 1}. **[${e.severity}] ${e.title}** (SKU: \`${e.sku}\`)\n   ${e.description}\n   *Credit Memo Recommended*: ₹${(e.recommendedCreditMemoPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
          )
          .join("\n\n"),
  ]
    .filter(Boolean)
    .join("\n");

  const report: ExceptionReport = {
    reportId: `rpt_${computeSha256(exceptions).slice(0, 12)}`,
    generatedAt: new Date().toISOString(),
    poNumber: bundle.purchaseOrder.poNumber,
    vendorName: bundle.purchaseOrder.vendorName,
    totalExceptions: exceptions.length,
    totalFinancialImpactPaise,
    totalCreditMemoRecommendedPaise,
    items: exceptions,
    executiveSummaryMarkdown,
  };

  const digest = computeSha256(report);
  const durationMs = Date.now() - start;

  return { report, digest, durationMs };
}

// ==========================================
// Main Pipeline Orchestrator
// ==========================================

export interface ExecuteReceivingPipelineOptions {
  documents: ReceivingDocumentBundle;
  erpBaseline?: ErpBaselineItem[];
  resolution?: CheckpointResolution;
  onProgress?: (event: {
    stage: string;
    status: "START" | "COMPLETE";
    data?: unknown;
  }) => void;
}

export async function executeReceivingPipeline(
  options: ExecuteReceivingPipelineOptions
): Promise<ReceivingExecutionResult> {
  const startedAt = new Date().toISOString();
  const overallStart = Date.now();
  const { documents, erpBaseline = [], resolution, onProgress } = options;

  // 1. Evidence Reader Stage
  onProgress?.({ stage: "EVIDENCE_READER", status: "START" });
  const stage1 = runEvidenceReaderStage(documents);
  onProgress?.({ stage: "EVIDENCE_READER", status: "COMPLETE", data: stage1.data });

  // 2. Reconciliation Specialist Stage
  onProgress?.({ stage: "RECONCILIATION_SPECIALIST", status: "START" });
  const stage2 = runReconciliationSpecialistStage(documents);
  onProgress?.({ stage: "RECONCILIATION_SPECIALIST", status: "COMPLETE", data: stage2.reconciliation });

  // 3. Exception Reporter Stage
  onProgress?.({ stage: "EXCEPTION_REPORTER", status: "START" });
  const stage3 = runExceptionReporterStage(documents, stage2.reconciliation);
  onProgress?.({ stage: "EXCEPTION_REPORTER", status: "COMPLETE", data: stage3.report });

  // 4. Human Checkpoint Evaluation
  let checkpoint = evaluateHumanCheckpoint(stage2.reconciliation, stage3.report);
  const requiresCheckpoint = Boolean(checkpoint);

  // 5. ERP State Diff
  let erpStateDiff = computeErpStateDiff(
    erpBaseline,
    stage2.reconciliation,
    stage3.report,
    documents.receivingLog.warehouseId,
    requiresCheckpoint
  );

  // If a resolution was provided immediately, resolve it
  if (checkpoint && resolution) {
    const resolved = resolveHumanCheckpoint(checkpoint, resolution, erpStateDiff);
    checkpoint = resolved.resolvedCheckpoint;
    erpStateDiff = resolved.updatedDiff;
  }

  // 6. Seal Receipt
  const stageRecords: ReceivingPipelineStageRecord[] = [
    {
      stage: "EVIDENCE_READER",
      agentName: "Evidence Reader v1.0.0",
      builderId: "builder-jordan-lee",
      status: "COMPLETED",
      latencyMs: stage1.durationMs,
      sha256Digest: stage1.digest,
      summary: `Extracted ${stage1.data.extractedLineItemsCount} lines across 3 documents. Verified vendor ${stage1.data.metadata.vendorName}.`,
    },
    {
      stage: "RECONCILIATION_SPECIALIST",
      agentName: "Reconciliation Specialist v1.1.0",
      builderId: "builder-jordan-lee",
      status: "COMPLETED",
      latencyMs: stage2.durationMs,
      sha256Digest: stage2.digest,
      summary: `Performed 3-way match on ${stage2.reconciliation.totalSkus} SKUs. Found ${stage2.reconciliation.discrepancyCount} discrepancies, ${stage2.reconciliation.totalDamagedQuantity} damaged units.`,
    },
    {
      stage: "EXCEPTION_REPORTER",
      agentName: "Exception Reporter v1.0.0",
      builderId: "builder-jordan-lee",
      status: "COMPLETED",
      latencyMs: stage3.durationMs,
      sha256Digest: stage3.digest,
      summary: `Compiled ${stage3.report.totalExceptions} exceptions. Drafted credit memo recommendation of ₹${(stage3.report.totalCreditMemoRecommendedPaise / 100).toFixed(2)}.`,
    },
  ];

  const sealedReceipt = sealReceivingReceipt({
    bundle: documents,
    stages: stageRecords,
    reconciliation: stage2.reconciliation,
    erpStateDiff,
    checkpoint,
  });

  const totalDurationMs = Date.now() - overallStart;
  const completedAt = new Date().toISOString();

  return {
    executionId: `exec_recv_${computeSha256(sealedReceipt).slice(0, 12)}`,
    startedAt,
    completedAt,
    totalDurationMs,
    extractedDocuments: documents,
    reconciliation: stage2.reconciliation,
    exceptionReport: stage3.report,
    erpStateDiff,
    checkpoint,
    sealedReceipt,
  };
}
