import { ReceivingScenario } from "@/lib/contracts/receiving-types";

export const RECEIVING_SCENARIOS: ReceivingScenario[] = [
  {
    id: "industrial-valves-discrepancy",
    name: "Industrial Valves: 3-Way Discrepancy & Price Drift",
    industry: "Heavy Industrial & Energy",
    skuCategory: "Class 300 Flanged Ball Valves",
    badge: "Variance Escalation",
    description:
      "A high-value shipment of carbon steel valves arrives with a 4.44% invoice price drift, 2 missing units, and 1 damaged flange face. Triggers policy checkpoint requiring human approval.",
    expectedOutcome:
      "Triggers Human Checkpoint (Price drift 4.44% > 2.0% & damaged goods). 47 accepted units, 2 short, 1 damaged. Drafts ₹2,41,000 credit memo.",
    documents: {
      purchaseOrder: {
        poNumber: "PO-2026-VALV-882",
        vendorId: "VND-APEX-VALVES-GLOBAL",
        vendorName: "Apex High-Pressure Valves Ltd",
        orderDate: "2026-10-15T09:30:00Z",
        currency: "INR",
        items: [
          {
            sku: "VALVE-FLG-300-CS",
            description: '4" Class 300 Carbon Steel Flanged Ball Valve WCB/316 Trim',
            orderedQuantity: 50,
            unitCostPaise: 4500000, // ₹45,000.00
            totalPaise: 225000000, // ₹22,50,000.00
          },
        ],
        totalAmountPaise: 225000000,
      },
      packingSlip: {
        slipNumber: "PS-88201-AX",
        poNumber: "PO-2026-VALV-882",
        vendorId: "VND-APEX-VALVES-GLOBAL",
        vendorName: "Apex High-Pressure Valves Ltd",
        shipDate: "2026-10-24T14:00:00Z",
        carrier: "Blue Dart Freight Heavy",
        trackingNumber: "BDF-9921-4820",
        items: [
          {
            sku: "VALVE-FLG-300-CS",
            shippedQuantity: 50,
            invoicedUnitCostPaise: 4700000, // ₹47,000.00 (+₹2,000 = +4.44%)
            lotNumber: "LOT-2026-VALV-Q4",
          },
        ],
      },
      receivingLog: {
        receivingId: "RCV-WH1-2026-0091",
        warehouseId: "WH-MUMBAI-01",
        warehouseName: "Mumbai Central Industrial Hub",
        inspectorName: "Vikas Deshmukh (QC Inspector II)",
        scanDate: "2026-10-31T08:15:00Z",
        dockDoor: "DOCK-04-HEAVY",
        items: [
          {
            sku: "VALVE-FLG-300-CS",
            receivedQuantity: 48, // 2 units short of 50
            damagedQuantity: 1, // 1 unit with flange sealing surface damage
            conditionNotes:
              "Flange face on pallet 2 unit #4 contains deep radial gouge; fails ASME B16.5 gasket seating test. 2 units missing from crate 3.",
            barcode: "8904018290192",
            inspectedAt: "2026-10-31T08:45:00Z",
          },
        ],
      },
    },
    erpBaseline: [
      {
        sku: "VALVE-FLG-300-CS",
        description: '4" Class 300 Carbon Steel Flanged Ball Valve WCB/316 Trim',
        currentOnHand: 14,
        unitCostPaise: 4500000,
        totalValuationPaise: 63000000, // 14 * ₹45,000 = ₹6,30,000
        locationCode: "BAY-C-RACK-02",
      },
    ],
  },
  {
    id: "semiconductor-clean-match",
    name: "Semiconductors: Automated Clean 3-Way Match",
    industry: "High-Tech & Semiconductor",
    skuCategory: "Automotive Grade MCUs",
    badge: "Clean Match",
    description:
      "A batch of 1,000 automotive microcontrollers matches Purchase Order, Supplier Invoice, and reel-level inspection scans perfectly. Zero variances, immediate automated ERP ledger commit.",
    expectedOutcome:
      "100% clean match across all three documents. Zero price variance, zero damage. Direct automated inventory increment of 1,000 units.",
    documents: {
      purchaseOrder: {
        poNumber: "PO-2026-SEMI-410",
        vendorId: "VND-SILICON-CORE-APAC",
        vendorName: "Silicon Core APAC Pte",
        orderDate: "2026-10-18T11:00:00Z",
        currency: "INR",
        items: [
          {
            sku: "MCU-STM32H7-IND",
            description: "Arm Cortex-M7 480MHz MCU 2MB Flash LQFP144 Automotive Grade",
            orderedQuantity: 1000,
            unitCostPaise: 85000, // ₹850.00
            totalPaise: 85000000, // ₹8,50,000.00
          },
        ],
        totalAmountPaise: 85000000,
      },
      packingSlip: {
        slipNumber: "PS-SC-41098",
        poNumber: "PO-2026-SEMI-410",
        vendorId: "VND-SILICON-CORE-APAC",
        vendorName: "Silicon Core APAC Pte",
        shipDate: "2026-10-26T06:30:00Z",
        carrier: "DHL Express Cold-Chain ESD",
        trackingNumber: "DHL-ESD-9912048",
        items: [
          {
            sku: "MCU-STM32H7-IND",
            shippedQuantity: 1000,
            invoicedUnitCostPaise: 85000,
            lotNumber: "LOT-M7-2026W42",
          },
        ],
      },
      receivingLog: {
        receivingId: "RCV-WH2-2026-0312",
        warehouseId: "WH-BLR-02",
        warehouseName: "Bengaluru Electronics Distribution Facility",
        inspectorName: "Ananya Iyer (ESD Specialist)",
        scanDate: "2026-10-31T07:45:00Z",
        dockDoor: "CLEANROOM-AIRLOCK-01",
        items: [
          {
            sku: "MCU-STM32H7-IND",
            receivedQuantity: 1000,
            damagedQuantity: 0,
            conditionNotes: "ESD moisture barrier bags intact. Humidity indicator card 10% RH safe. 1,000 units verified.",
            barcode: "8907812901123",
            inspectedAt: "2026-10-31T08:10:00Z",
          },
        ],
      },
    },
    erpBaseline: [
      {
        sku: "MCU-STM32H7-IND",
        description: "Arm Cortex-M7 480MHz MCU 2MB Flash LQFP144 Automotive Grade",
        currentOnHand: 250,
        unitCostPaise: 85000,
        totalValuationPaise: 21250000, // 250 * ₹850 = ₹2,12,500
        locationCode: "VAULT-ESD-ZONE-A",
      },
    ],
  },
  {
    id: "consumer-electronics-shortage",
    name: "Consumer Electronics: Short Shipment Exception",
    industry: "Commercial Electronics",
    skuCategory: "Commercial 4K Interactive Displays",
    badge: "Short Shipment",
    description:
      "A shipment of 100 interactive 4K displays has 12 units missing on dock count. The packing slip claims all 100 shipped. Pipeline increments inventory by 88 and generates a ₹3,84,000 credit memo.",
    expectedOutcome:
      "Physical count 88 vs 100 invoiced. No price variance, no physical damage. Inventory incremented by 88; pending credit memo for 12 short units generated.",
    documents: {
      purchaseOrder: {
        poNumber: "PO-2026-DISP-519",
        vendorId: "VND-LUMEN-PANELS-CO",
        vendorName: "Lumen Optronics Displays Co",
        orderDate: "2026-10-12T10:00:00Z",
        currency: "INR",
        items: [
          {
            sku: "DISP-4K-PRO-65",
            description: '65" Commercial 4K Interactive Touch Display Anti-Glare OPS-Ready',
            orderedQuantity: 100,
            unitCostPaise: 3200000, // ₹32,000.00
            totalPaise: 320000000, // ₹32,00,000.00
          },
        ],
        totalAmountPaise: 320000000,
      },
      packingSlip: {
        slipNumber: "PS-LP-51904",
        poNumber: "PO-2026-DISP-519",
        vendorId: "VND-LUMEN-PANELS-CO",
        vendorName: "Lumen Optronics Displays Co",
        shipDate: "2026-10-25T16:00:00Z",
        carrier: "Gati KWE Logistics",
        trackingNumber: "GAT-7719-2041",
        items: [
          {
            sku: "DISP-4K-PRO-65",
            shippedQuantity: 100,
            invoicedUnitCostPaise: 3200000,
            lotNumber: "LOT-DISP-Q4-88",
          },
        ],
      },
      receivingLog: {
        receivingId: "RCV-WH1-2026-0104",
        warehouseId: "WH-MUMBAI-01",
        warehouseName: "Mumbai Central Industrial Hub",
        inspectorName: "Rohan Kulkarni (Inbound Logistics Lead)",
        scanDate: "2026-10-31T09:00:00Z",
        dockDoor: "DOCK-02-PALLET",
        items: [
          {
            sku: "DISP-4K-PRO-65",
            receivedQuantity: 88, // 12 units short
            damagedQuantity: 0,
            conditionNotes:
              "Delivered 11 pallets containing 8 cartons each = 88 units. Manifest claimed 100 units (12 pallets). Missing pallet #12 confirmed by driver.",
            barcode: "8909102941094",
            inspectedAt: "2026-10-31T09:20:00Z",
          },
        ],
      },
    },
    erpBaseline: [
      {
        sku: "DISP-4K-PRO-65",
        description: '65" Commercial 4K Interactive Touch Display Anti-Glare OPS-Ready',
        currentOnHand: 8,
        unitCostPaise: 3200000,
        totalValuationPaise: 25600000, // 8 * ₹32,000 = ₹2,56,000
        locationCode: "PALLET-RACK-ZONE-B",
      },
    ],
  },
];

export function getReceivingScenarioById(id: string): ReceivingScenario | undefined {
  return RECEIVING_SCENARIOS.find((s) => s.id === id);
}
