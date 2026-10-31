import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import {
  executeReceivingPipeline,
  runEvidenceReaderStage,
  runReconciliationSpecialistStage,
  runExceptionReporterStage,
  computeErpStateDiff,
  evaluateHumanCheckpoint,
  resolveHumanCheckpoint,
  sealReceivingReceipt,
  verifyReceivingReceipt,
  computeSha256,
} from "@/server/solutions/receiving-engine";
import {
  RECEIVING_SCENARIOS,
  getReceivingScenarioById,
} from "@/server/solutions/receiving-scenarios";
import { GET as sampleDataHandler } from "@/app/api/solutions/receiving/sample-data/route";
import { POST as executeHandler } from "@/app/api/solutions/receiving/execute/route";

describe("Autonomous Receiving and Inventory Reconciliation Northstar Suite", () => {
  const industrialValvesScenario = getReceivingScenarioById("industrial-valves-discrepancy")!;
  const semiconductorScenario = getReceivingScenarioById("semiconductor-clean-match")!;
  const consumerElectronicsScenario = getReceivingScenarioById("consumer-electronics-shortage")!;

  describe("1. Document Extraction & Evidence Reader Agent", () => {
    it("extracts structured line items and vendor metadata from documents bundle", () => {
      const { data, digest, durationMs } = runEvidenceReaderStage(industrialValvesScenario.documents);

      expect(data.bundle.purchaseOrder.poNumber).toBe("PO-2026-VALV-882");
      expect(data.bundle.packingSlip.slipNumber).toBe("PS-88201-AX");
      expect(data.bundle.receivingLog.receivingId).toBe("RCV-WH1-2026-0091");
      expect(data.extractedLineItemsCount).toBe(3);
      expect(data.metadata.vendorName).toBe("Apex High-Pressure Valves Ltd");
      expect(data.metadata.currency).toBe("INR");
      expect(digest).toHaveLength(64);
      expect(durationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("2. Reconciliation Specialist & 3-Way Matching Engine", () => {
    it("identifies multi-variance in Industrial Valves: 2 short, 1 damaged, 4.44% price drift", () => {
      const { reconciliation, digest } = runReconciliationSpecialistStage(
        industrialValvesScenario.documents
      );

      expect(reconciliation.totalSkus).toBe(1);
      expect(reconciliation.totalOrderedQuantity).toBe(50);
      expect(reconciliation.totalShippedQuantity).toBe(50);
      expect(reconciliation.totalReceivedQuantity).toBe(48);
      expect(reconciliation.totalDamagedQuantity).toBe(1);
      expect(reconciliation.totalAcceptedQuantity).toBe(47); // 48 - 1 = 47
      expect(reconciliation.maxPriceVariancePercent).toBeCloseTo(4.44, 1);
      expect(reconciliation.hasDamagedGoods).toBe(true);
      expect(reconciliation.hasPriceVarianceOverTolerance).toBe(true);
      expect(reconciliation.requiresHumanCheckpoint).toBe(true);
      expect(reconciliation.checkpointReason).toContain("Damaged goods reported");
      expect(digest).toHaveLength(64);

      const item = reconciliation.itemMatches[0];
      expect(item.sku).toBe("VALVE-FLG-300-CS");
      expect(item.quantityDiscrepancy).toBe(-3); // 47 accepted - 50 ordered = -3
      expect(item.poUnitCostPaise).toBe(4500000);
      expect(item.invoicedUnitCostPaise).toBe(4700000);
      expect(item.status).toBe("DISCREPANCY_REQUIRES_REVIEW");
    });

    it("performs 100% clean 3-way match in Semiconductor scenario", () => {
      const { reconciliation } = runReconciliationSpecialistStage(
        semiconductorScenario.documents
      );

      expect(reconciliation.totalOrderedQuantity).toBe(1000);
      expect(reconciliation.totalShippedQuantity).toBe(1000);
      expect(reconciliation.totalReceivedQuantity).toBe(1000);
      expect(reconciliation.totalDamagedQuantity).toBe(0);
      expect(reconciliation.totalAcceptedQuantity).toBe(1000);
      expect(reconciliation.maxPriceVariancePercent).toBe(0);
      expect(reconciliation.hasDamagedGoods).toBe(false);
      expect(reconciliation.hasPriceVarianceOverTolerance).toBe(false);
      expect(reconciliation.requiresHumanCheckpoint).toBe(false);
      expect(reconciliation.itemMatches[0].status).toBe("PERFECT_MATCH");
    });

    it("identifies short shipment in Consumer Electronics scenario without price drift", () => {
      const { reconciliation } = runReconciliationSpecialistStage(
        consumerElectronicsScenario.documents
      );

      expect(reconciliation.totalOrderedQuantity).toBe(100);
      expect(reconciliation.totalShippedQuantity).toBe(100);
      expect(reconciliation.totalReceivedQuantity).toBe(88);
      expect(reconciliation.totalDamagedQuantity).toBe(0);
      expect(reconciliation.totalAcceptedQuantity).toBe(88);
      expect(reconciliation.itemMatches[0].quantityDiscrepancy).toBe(-12);
      expect(reconciliation.itemMatches[0].status).toBe("SHORT_SHIPMENT");
      expect(reconciliation.hasPriceVarianceOverTolerance).toBe(false);
      expect(reconciliation.hasDamagedGoods).toBe(false);
    });
  });

  describe("3. Exception Reporter & Credit Memo Engine", () => {
    it("drafts itemized credit memo recommendations citing specific document evidence", () => {
      const stage2 = runReconciliationSpecialistStage(industrialValvesScenario.documents);
      const { report, digest } = runExceptionReporterStage(
        industrialValvesScenario.documents,
        stage2.reconciliation
      );

      expect(report.totalExceptions).toBe(3); // Short shipment, Damaged goods, Price drift exceeded
      expect(report.totalFinancialImpactPaise).toBeGreaterThan(0);
      expect(report.totalCreditMemoRecommendedPaise).toBeGreaterThan(0);
      expect(digest).toHaveLength(64);

      // Check evidence citations
      const shortException = report.items.find((i) => i.type === "SHORT_SHIPMENT");
      expect(shortException).toBeDefined();
      expect(shortException?.evidence).toHaveLength(3); // PO, Packing slip, Receiving log
      expect(shortException?.recommendedCreditMemoPaise).toBe(2 * 4700000); // 2 units @ ₹47,000

      const dmgException = report.items.find((i) => i.type === "DAMAGED_GOODS");
      expect(dmgException).toBeDefined();
      expect(dmgException?.recommendedCreditMemoPaise).toBe(1 * 4700000); // 1 unit @ ₹47,000

      const priceException = report.items.find((i) => i.type === "PRICE_DRIFT_EXCEEDED");
      expect(priceException).toBeDefined();
      expect(priceException?.recommendedCreditMemoPaise).toBe(50 * 200000); // ₹2,000 drift * 50 = ₹1,00,000
    });

    it("calculates exact short-shipment credit memo for Consumer Electronics", () => {
      const stage2 = runReconciliationSpecialistStage(consumerElectronicsScenario.documents);
      const { report } = runExceptionReporterStage(
        consumerElectronicsScenario.documents,
        stage2.reconciliation
      );

      expect(report.totalExceptions).toBe(1);
      expect(report.items[0].type).toBe("SHORT_SHIPMENT");
      expect(report.totalCreditMemoRecommendedPaise).toBe(12 * 3200000); // 12 * ₹32,000 = ₹3,84,000 = 38400000 paise
    });
  });

  describe("4. ERP State Diff & Valuation Calculation", () => {
    it("generates before/after ERP inventory state diff with pending status when checkpoint required", () => {
      const stage2 = runReconciliationSpecialistStage(industrialValvesScenario.documents);
      const stage3 = runExceptionReporterStage(industrialValvesScenario.documents, stage2.reconciliation);

      const diff = computeErpStateDiff(
        industrialValvesScenario.erpBaseline,
        stage2.reconciliation,
        stage3.report,
        "WH-MUMBAI-01",
        true // checkpointPending
      );

      expect(diff.commitStatus).toBe("PENDING_HUMAN_CHECKPOINT");
      expect(diff.items).toHaveLength(1);
      const itemDiff = diff.items[0];
      expect(itemDiff.sku).toBe("VALVE-FLG-300-CS");
      expect(itemDiff.beforeOnHand).toBe(14);
      expect(itemDiff.afterOnHand).toBe(61); // 14 baseline + 47 accepted = 61
      expect(itemDiff.onHandDelta).toBe(47);
      expect(itemDiff.beforeValuationPaise).toBe(14 * 4500000);
      expect(itemDiff.afterValuationPaise).toBe(61 * 4500000);
      expect(itemDiff.status).toBe("HELD_PENDING_APPROVAL");
    });

    it("auto-commits clean match directly without approval hold", () => {
      const stage2 = runReconciliationSpecialistStage(semiconductorScenario.documents);
      const stage3 = runExceptionReporterStage(semiconductorScenario.documents, stage2.reconciliation);

      const diff = computeErpStateDiff(
        semiconductorScenario.erpBaseline,
        stage2.reconciliation,
        stage3.report,
        "WH-BLR-02",
        false // checkpointPending
      );

      expect(diff.commitStatus).toBe("AUTO_COMMITTED");
      expect(diff.items[0].status).toBe("COMMITTED");
      expect(diff.items[0].beforeOnHand).toBe(250);
      expect(diff.items[0].afterOnHand).toBe(1250);
      expect(diff.items[0].onHandDelta).toBe(1000);
    });
  });

  describe("5. Human Checkpoint Handler & Interactive Resolution", () => {
    it("emits human checkpoint when price variance exceeds 2.0% or damaged goods detected", () => {
      const stage2 = runReconciliationSpecialistStage(industrialValvesScenario.documents);
      const stage3 = runExceptionReporterStage(industrialValvesScenario.documents, stage2.reconciliation);

      const checkpoint = evaluateHumanCheckpoint(stage2.reconciliation, stage3.report);
      expect(checkpoint).toBeDefined();
      expect(checkpoint?.status).toBe("PENDING");
      expect(checkpoint?.triggers.length).toBeGreaterThanOrEqual(2);
      expect(checkpoint?.priceVariancePercent).toBeCloseTo(4.44, 1);
      expect(checkpoint?.damagedQuantity).toBe(1);
    });

    it("resolves checkpoint with APPROVE_WITH_CREDIT_MEMO", () => {
      const stage2 = runReconciliationSpecialistStage(industrialValvesScenario.documents);
      const stage3 = runExceptionReporterStage(industrialValvesScenario.documents, stage2.reconciliation);
      const checkpoint = evaluateHumanCheckpoint(stage2.reconciliation, stage3.report)!;
      const initialDiff = computeErpStateDiff(
        industrialValvesScenario.erpBaseline,
        stage2.reconciliation,
        stage3.report,
        "WH-MUMBAI-01",
        true
      );

      const { resolvedCheckpoint, updatedDiff } = resolveHumanCheckpoint(
        checkpoint,
        {
          action: "APPROVE_WITH_CREDIT_MEMO",
          reviewerName: "Priya Nair (Supply Chain Director)",
          notes: "Approved physical inventory commit of 47 units. Debit note of ₹2,41,000 dispatched to Apex Valves.",
          resolvedAt: new Date().toISOString(),
          authorizedCreditMemoPaise: 24100000,
        },
        initialDiff
      );

      expect(resolvedCheckpoint.status).toBe("APPROVED");
      expect(resolvedCheckpoint.resolution?.reviewerName).toBe("Priya Nair (Supply Chain Director)");
      expect(updatedDiff.commitStatus).toBe("MANUALLY_OVERRIDDEN");
      expect(updatedDiff.items[0].status).toBe("COMMITTED");
      expect(updatedDiff.items[0].onHandDelta).toBe(47);
    });

    it("resolves checkpoint with REJECT_SHIPMENT setting 0 on-hand delta", () => {
      const stage2 = runReconciliationSpecialistStage(industrialValvesScenario.documents);
      const stage3 = runExceptionReporterStage(industrialValvesScenario.documents, stage2.reconciliation);
      const checkpoint = evaluateHumanCheckpoint(stage2.reconciliation, stage3.report)!;
      const initialDiff = computeErpStateDiff(
        industrialValvesScenario.erpBaseline,
        stage2.reconciliation,
        stage3.report,
        "WH-MUMBAI-01",
        true
      );

      const { resolvedCheckpoint, updatedDiff } = resolveHumanCheckpoint(
        checkpoint,
        {
          action: "REJECT_SHIPMENT",
          reviewerName: "Priya Nair",
          notes: "Shipment rejected entirely due to quality non-conformance.",
          resolvedAt: new Date().toISOString(),
        },
        initialDiff
      );

      expect(resolvedCheckpoint.status).toBe("REJECTED");
      expect(updatedDiff.items[0].status).toBe("REJECTED");
      expect(updatedDiff.items[0].onHandDelta).toBe(0);
      expect(updatedDiff.items[0].afterOnHand).toBe(initialDiff.items[0].beforeOnHand);
    });
  });

  describe("6. Cryptographic Receipt Sealing & SHA-256 Verification", () => {
    it("seals receipt with SHA-256 canonical hash across all stages and verifies integrity", async () => {
      const result = await executeReceivingPipeline({
        documents: industrialValvesScenario.documents,
        erpBaseline: industrialValvesScenario.erpBaseline,
      });

      const receipt = result.sealedReceipt;
      expect(receipt.receiptId.startsWith("rcpt_recv_")).toBe(true);
      expect(receipt.sha256Hash).toHaveLength(64);
      expect(receipt.inputHash).toHaveLength(64);
      expect(receipt.stages).toHaveLength(3);
      expect(receipt.algorithm).toBe("SHA256:CANONICAL_JSON");

      // Verify receipt integrity
      const verification = verifyReceivingReceipt(receipt);
      expect(verification.valid).toBe(true);
      expect(verification.computedHash).toBe(receipt.sha256Hash);
    });

    it("fails verification if sealed receipt payload has been tampered with", async () => {
      const result = await executeReceivingPipeline({
        documents: semiconductorScenario.documents,
        erpBaseline: semiconductorScenario.erpBaseline,
      });

      const tamperedReceipt = {
        ...result.sealedReceipt,
        poNumber: "PO-TAMPERED-FRAUD-999",
      };

      const verification = verifyReceivingReceipt(tamperedReceipt);
      expect(verification.valid).toBe(false);
      expect(verification.computedHash).not.toBe(tamperedReceipt.sha256Hash);
    });
  });

  describe("7. API Route Integration", () => {
    it("GET /api/solutions/receiving/sample-data returns 3 curated scenarios", async () => {
      const req = new NextRequest("http://localhost:3000/api/solutions/receiving/sample-data");
      const res = await sampleDataHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.scenarios).toHaveLength(3);
      expect(json.scenarios.map((s: { id: string }) => s.id)).toEqual([
        "industrial-valves-discrepancy",
        "semiconductor-clean-match",
        "consumer-electronics-shortage",
      ]);
    });

    it("GET /api/solutions/receiving/sample-data?id=semiconductor-clean-match returns single scenario", async () => {
      const req = new NextRequest(
        "http://localhost:3000/api/solutions/receiving/sample-data?id=semiconductor-clean-match"
      );
      const res = await sampleDataHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.scenario.id).toBe("semiconductor-clean-match");
    });

    it("POST /api/solutions/receiving/execute runs synchronous execution for scenarioId", async () => {
      const req = new NextRequest("http://localhost:3000/api/solutions/receiving/execute", {
        method: "POST",
        body: JSON.stringify({
          scenarioId: "consumer-electronics-shortage",
        }),
      });

      const res = await executeHandler(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.result.executionId.startsWith("exec_recv_")).toBe(true);
      expect(json.result.reconciliation.totalReceivedQuantity).toBe(88);
      expect(json.result.erpStateDiff.items[0].onHandDelta).toBe(88);
      expect(json.result.sealedReceipt.sha256Hash).toHaveLength(64);
    });

    it("POST /api/solutions/receiving/execute supports SSE streaming execution", async () => {
      const req = new NextRequest("http://localhost:3000/api/solutions/receiving/execute", {
        method: "POST",
        body: JSON.stringify({
          scenarioId: "industrial-valves-discrepancy",
          stream: true,
        }),
        headers: {
          accept: "text/event-stream",
        },
      });

      const res = await executeHandler(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("text/event-stream");

      const reader = res.body?.getReader();
      expect(reader).toBeDefined();

      const decoder = new TextDecoder();
      let streamedText = "";
      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        streamedText += decoder.decode(value);
      }

      expect(streamedText).toContain("event: pipeline-start");
      expect(streamedText).toContain("event: stage-complete");
      expect(streamedText).toContain("event: checkpoint-emitted");
      expect(streamedText).toContain("event: erp-diff");
      expect(streamedText).toContain("event: receipt-sealed");
      expect(streamedText).toContain("event: pipeline-complete");
    });
  });
});
