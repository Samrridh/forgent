import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateEscrowSplit,
  lockEscrow,
  settleEscrow,
  refundEscrow,
  getEscrowHold,
  getSettlementRecord,
  escrowHoldStore,
  settlementRecordStore,
} from "@/server/economics/escrow";
import { POST as checkoutPost, GET as checkoutGet } from "@/app/api/payments/checkout/route";
import { NextRequest } from "next/server";

describe("Atomic Escrow Economics & Settlement Engine", () => {
  beforeEach(() => {
    escrowHoldStore.clear();
    settlementRecordStore.clear();
  });

  describe("calculateEscrowSplit", () => {
    it("splits fees into exactly 85% creator payout and 15% platform infrastructure fee", () => {
      const split = calculateEscrowSplit(10000, 100); // 10,000 paise (₹100), 100 cents ($1.00)

      expect(split.totalPaise).toBe(10000);
      expect(split.creatorPayoutPaise).toBe(8500);
      expect(split.platformFeePaise).toBe(1500);
      expect(split.creatorPayoutPaise + split.platformFeePaise).toBe(split.totalPaise);

      expect(split.totalCents).toBe(100);
      expect(split.creatorPayoutCents).toBe(85);
      expect(split.platformFeeCents).toBe(15);
      expect(split.creatorPayoutCents + split.platformFeeCents).toBe(split.totalCents);

      expect(split.creatorShareBps).toBe(8500);
      expect(split.platformShareBps).toBe(1500);
    });

    it("guarantees zero penny or paise leaks for odd/prime amounts", () => {
      const testCases = [
        { paise: 28001, cents: 351 },
        { paise: 9999, cents: 125 },
        { paise: 101, cents: 1 },
        { paise: 1, cents: 1 },
        { paise: 200000, cents: 2500 },
      ];

      for (const tc of testCases) {
        const split = calculateEscrowSplit(tc.paise, tc.cents);
        expect(split.creatorPayoutPaise + split.platformFeePaise).toBe(tc.paise);
        expect(split.creatorPayoutCents + split.platformFeeCents).toBe(tc.cents);
        expect(split.creatorPayoutPaise).toBeGreaterThanOrEqual(0);
        expect(split.platformFeePaise).toBeGreaterThanOrEqual(0);
      }
    });

    it("handles zero and boundary amounts safely", () => {
      const split = calculateEscrowSplit(0, 0);
      expect(split.totalPaise).toBe(0);
      expect(split.creatorPayoutPaise).toBe(0);
      expect(split.platformFeePaise).toBe(0);
      expect(split.creatorPayoutCents).toBe(0);
      expect(split.platformFeeCents).toBe(0);
    });
  });

  describe("Escrow Lifecycle: Lock -> Settle -> Refund", () => {
    it("locks funds atomically before job execution", async () => {
      const jobId = "job_test_lock_001";
      const hold = await lockEscrow({
        jobId,
        buyerId: "usr_buyer_alice",
        builderId: "bld_fintech_studio",
        amountPaise: 40000, // ₹400
        amountCents: 500, // $5.00
      });

      expect(hold.jobId).toBe(jobId);
      expect(hold.status).toBe("LOCKED");
      expect(hold.totalPaise).toBe(40000);
      expect(hold.totalCents).toBe(500);
      expect(hold.split.creatorPayoutPaise).toBe(34000);
      expect(hold.split.platformFeePaise).toBe(6000);

      const retrieved = getEscrowHold(jobId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.status).toBe("LOCKED");
    });

    it("settles escrow upon verification with 85% creator payout and 15% platform fee", async () => {
      const jobId = "job_test_settle_002";
      await lockEscrow({
        jobId,
        builderId: "bld_fintech_studio",
        amountPaise: 80000, // ₹800
        amountCents: 1000, // $10.00
      });

      const settlement = await settleEscrow({
        jobId,
        builderId: "bld_fintech_studio",
        payoutMethod: "STRIPE",
      });

      expect(settlement.jobId).toBe(jobId);
      expect(settlement.status).toBe("SETTLED");
      expect(settlement.builderAmountPaise).toBe(68000); // 85% of 80,000
      expect(settlement.platformFeePaise).toBe(12000); // 15% of 80,000
      expect(settlement.builderAmountCents).toBe(850); // 85% of 1,000
      expect(settlement.platformFeeCents).toBe(150); // 15% of 1,000
      expect(settlement.payoutReference).toMatch(/^str_transfer_/);

      const hold = getEscrowHold(jobId);
      expect(hold?.status).toBe("SETTLED");
      expect(hold?.settledAt).toBeDefined();

      const record = getSettlementRecord(jobId);
      expect(record?.settlementId).toBe(settlement.settlementId);
    });

    it("refunds full locked escrow upon failure or watchdog breach", async () => {
      const jobId = "job_test_refund_003";
      await lockEscrow({
        jobId,
        buyerId: "usr_buyer_alice",
        amountPaise: 20000,
        amountCents: 250,
      });

      const refund = await refundEscrow({
        jobId,
        reason: "Execution timeout breached SLA",
      });

      expect(refund.jobId).toBe(jobId);
      expect(refund.status).toBe("REFUNDED");
      expect(refund.refundedPaise).toBe(20000);
      expect(refund.refundedCents).toBe(250);
      expect(refund.reason).toBe("Execution timeout breached SLA");

      const hold = getEscrowHold(jobId);
      expect(hold?.status).toBe("REFUNDED");
      expect(hold?.refundedAt).toBeDefined();
    });
  });
});

describe("Dual-Rail Payment Checkout API", () => {
  it("processes Stripe Card (USD) top-up and credits wallet balance", async () => {
    const req = new NextRequest("http://localhost:3000/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gateway: "stripe",
        amount: 5000, // $50.00 in cents
        currency: "USD",
        paymentMethodDetails: {
          cardNumber: "4242 4242 4242 4242",
          cardholderName: "Alex Morgan",
          postalCode: "94103",
        },
      }),
    });

    const res = await checkoutPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.gateway).toBe("stripe");
    expect(body.currency).toBe("USD");
    expect(body.amountCredited.cents).toBe(5000);
    expect(body.amountCredited.usd).toBe(50);
    expect(body.amountCredited.paise).toBe(400000); // 5000 * 80
    expect(body.referenceId).toMatch(/^ch_stripe_test_/);
    expect(body.paymentMethodDetails.cardLast4).toBe("4242");
    expect(body.newBalance.cents).toBeGreaterThanOrEqual(5000);
  });

  it("processes Razorpay UPI (INR) top-up with VPA validation and credits wallet", async () => {
    const req = new NextRequest("http://localhost:3000/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gateway: "razorpay",
        amount: 400000, // ₹4,000.00 in paise
        currency: "INR",
        paymentMethodDetails: {
          vpa: "user@okhdfcbank",
        },
      }),
    });

    const res = await checkoutPost(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.gateway).toBe("razorpay");
    expect(body.currency).toBe("INR");
    expect(body.amountCredited.paise).toBe(400000);
    expect(body.amountCredited.inr).toBe(4000);
    expect(body.amountCredited.cents).toBe(5000); // 400000 / 80
    expect(body.referenceId).toMatch(/^pay_rzp_test_/);
    expect(body.paymentMethodDetails.vpa).toBe("user@okhdfcbank");
  });

  it("rejects invalid payment payloads with 400", async () => {
    const req = new NextRequest("http://localhost:3000/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gateway: "unsupported_gateway",
        amount: -500,
        currency: "EUR",
      }),
    });

    const res = await checkoutPost(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns current wallet balance and transactions on GET", async () => {
    const res = await checkoutGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.wallet).toBeDefined();
    expect(body.wallet.balanceCents).toBeGreaterThan(0);
    expect(body.wallet.balancePaise).toBeGreaterThan(0);
    expect(Array.isArray(body.recentTransactions)).toBe(true);
  });
});
