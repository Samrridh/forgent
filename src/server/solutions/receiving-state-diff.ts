import { computeSha256 } from "./receiving-receipt";
import {
  ErpBaselineItem,
  ErpStateDiff,
  ErpItemStateDiff,
  ReconciliationResult,
  ExceptionReport,
  HumanCheckpoint,
  CheckpointResolution,
} from "@/lib/contracts/receiving-types";

// ==========================================
// ERP State Diff Engine
// ==========================================

export function computeErpStateDiff(
  baseline: ErpBaselineItem[],
  reconciliation: ReconciliationResult,
  exceptionReport: ExceptionReport,
  warehouseId: string,
  checkpointPending: boolean
): ErpStateDiff {
  const baselineMap = new Map(baseline.map((b) => [b.sku, b]));
  const itemDiffs: ErpItemStateDiff[] = [];

  let netOnHandDelta = 0;
  let netValuationDeltaPaise = 0;
  let totalPendingCreditPaise = 0;

  for (const match of reconciliation.itemMatches) {
    const base = baselineMap.get(match.sku) || {
      sku: match.sku,
      description: match.description,
      currentOnHand: 0,
      unitCostPaise: match.poUnitCostPaise,
      totalValuationPaise: 0,
      locationCode: "MAIN-WH-01",
    };

    const beforeOnHand = base.currentOnHand;
    const acceptedQty = match.acceptedQuantity;
    const onHandDelta = acceptedQty;
    const afterOnHand = beforeOnHand + onHandDelta;

    const beforeUnitCostPaise = base.unitCostPaise;
    const afterUnitCostPaise = match.poUnitCostPaise;
    const unitCostDeltaPaise = afterUnitCostPaise - beforeUnitCostPaise;

    const beforeValuationPaise = base.totalValuationPaise;
    const afterValuationPaise = afterOnHand * afterUnitCostPaise;
    const valuationDeltaPaise = afterValuationPaise - beforeValuationPaise;

    const skuExceptions = exceptionReport.items.filter((e) => e.sku === match.sku);
    const skuCreditPaise = skuExceptions.reduce(
      (sum, e) => sum + e.recommendedCreditMemoPaise,
      0
    );

    netOnHandDelta += onHandDelta;
    netValuationDeltaPaise += valuationDeltaPaise;
    totalPendingCreditPaise += skuCreditPaise;

    const status = checkpointPending ? "HELD_PENDING_APPROVAL" : "COMMITTED";

    itemDiffs.push({
      sku: match.sku,
      description: match.description,
      beforeOnHand,
      afterOnHand,
      onHandDelta,
      beforeUnitCostPaise,
      afterUnitCostPaise,
      unitCostDeltaPaise,
      beforeValuationPaise,
      afterValuationPaise,
      valuationDeltaPaise,
      pendingInvoiceCreditPaise: skuCreditPaise,
      status,
    });
  }

  return {
    diffId: `diff_${computeSha256(itemDiffs).slice(0, 12)}`,
    generatedAt: new Date().toISOString(),
    warehouseId,
    items: itemDiffs,
    netOnHandDelta,
    netValuationDeltaPaise,
    totalPendingCreditPaise,
    commitStatus: checkpointPending ? "PENDING_HUMAN_CHECKPOINT" : "AUTO_COMMITTED",
  };
}

// ==========================================
// Human Checkpoint Handler
// ==========================================

export function evaluateHumanCheckpoint(
  reconciliation: ReconciliationResult,
  exceptionReport: ExceptionReport
): HumanCheckpoint | undefined {
  if (!reconciliation.requiresHumanCheckpoint) {
    return undefined;
  }

  const triggers: HumanCheckpoint["triggers"] = [];

  if (reconciliation.hasPriceVarianceOverTolerance) {
    triggers.push({
      type: "PRICE_VARIANCE_EXCEEDED",
      threshold: "2.0%",
      observed: `${reconciliation.maxPriceVariancePercent.toFixed(2)}%`,
      description: "Invoiced unit cost exceeds purchase order contracted rate by > 2.0%",
    });
  }

  if (reconciliation.hasDamagedGoods) {
    triggers.push({
      type: "DAMAGED_GOODS_DETECTED",
      threshold: "0 units damaged",
      observed: `${reconciliation.totalDamagedQuantity} units non-conforming`,
      description: "Warehouse physical inspection found damaged or out-of-spec merchandise",
    });
  }

  const shortQty = Math.max(
    0,
    reconciliation.totalOrderedQuantity - reconciliation.totalReceivedQuantity
  );

  return {
    checkpointId: `chk_${computeSha256({ rec: reconciliation.reconciliationId, triggers }).slice(0, 12)}`,
    createdAt: new Date().toISOString(),
    status: "PENDING",
    reason: reconciliation.checkpointReason || "Policy exception limits exceeded; human sign-off mandatory",
    triggers,
    priceVariancePercent: reconciliation.maxPriceVariancePercent,
    damagedQuantity: reconciliation.totalDamagedQuantity,
    shortQuantity: shortQty,
    financialExposurePaise: exceptionReport.totalFinancialImpactPaise,
  };
}

export function resolveHumanCheckpoint(
  checkpoint: HumanCheckpoint,
  resolution: CheckpointResolution,
  currentDiff: ErpStateDiff
): {
  resolvedCheckpoint: HumanCheckpoint;
  updatedDiff: ErpStateDiff;
} {
  const resolvedCheckpoint: HumanCheckpoint = {
    ...checkpoint,
    status: resolution.action === "REJECT_SHIPMENT" ? "REJECTED" : "APPROVED",
    resolution,
  };

  const updatedItems = currentDiff.items.map((item) => {
    if (resolution.action === "REJECT_SHIPMENT") {
      return {
        ...item,
        afterOnHand: item.beforeOnHand,
        onHandDelta: 0,
        afterValuationPaise: item.beforeValuationPaise,
        valuationDeltaPaise: 0,
        status: "REJECTED" as const,
      };
    }
    return {
      ...item,
      status: "COMMITTED" as const,
    };
  });

  const netOnHandDelta = updatedItems.reduce((acc, i) => acc + i.onHandDelta, 0);
  const netValuationDeltaPaise = updatedItems.reduce((acc, i) => acc + i.valuationDeltaPaise, 0);

  const updatedDiff: ErpStateDiff = {
    ...currentDiff,
    items: updatedItems,
    netOnHandDelta,
    netValuationDeltaPaise,
    commitStatus: "MANUALLY_OVERRIDDEN",
  };

  return { resolvedCheckpoint, updatedDiff };
}
