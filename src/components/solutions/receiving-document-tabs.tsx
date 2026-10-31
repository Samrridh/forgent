"use client";

import React, { useState } from "react";
import { FileText, Truck, ClipboardCheck } from "lucide-react";
import { ReceivingDocumentBundle } from "@/lib/contracts/receiving-types";

interface ReceivingDocumentTabsProps {
  documents: ReceivingDocumentBundle;
}

export function ReceivingDocumentTabs({ documents }: ReceivingDocumentTabsProps) {
  const [activeTab, setActiveTab] = useState<"PO" | "SLIP" | "LOG">("PO");

  const formatPaise = (paise: number) => {
    return (paise / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      {/* Tabs Header */}
      <div className="flex items-center border-b border-slate-200 bg-porcelain-100/70 px-4 pt-3 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("PO")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === "PO"
              ? "bg-white text-cobalt-600 border-cobalt-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Purchase Order ({documents.purchaseOrder.poNumber})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SLIP")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === "SLIP"
              ? "bg-white text-cobalt-600 border-cobalt-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100"
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Packing Slip ({documents.packingSlip.slipNumber})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("LOG")}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 ${
            activeTab === "LOG"
              ? "bg-white text-cobalt-600 border-cobalt-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100"
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Dock Receiving Scan ({documents.receivingLog.receivingId})</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-5 text-xs font-mono">
        {activeTab === "PO" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-porcelain-50 border border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-400 block uppercase">Vendor</span>
                <span className="font-bold text-slate-800">{documents.purchaseOrder.vendorName}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">PO Reference</span>
                <span className="font-bold text-slate-800">{documents.purchaseOrder.poNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Order Date</span>
                <span className="text-slate-700">{new Date(documents.purchaseOrder.orderDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Total Contract Value</span>
                <span className="font-bold text-cobalt-700">₹{formatPaise(documents.purchaseOrder.totalAmountPaise)}</span>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                  <th className="py-2">SKU Identifier</th>
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center">Ordered Qty</th>
                  <th className="py-2 text-right">Agreed Rate</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.purchaseOrder.items.map((item) => (
                  <tr key={item.sku}>
                    <td className="py-2.5 font-bold text-slate-900">{item.sku}</td>
                    <td className="py-2.5 text-slate-600 font-sans">{item.description}</td>
                    <td className="py-2.5 text-center font-bold">{item.orderedQuantity}</td>
                    <td className="py-2.5 text-right">₹{formatPaise(item.unitCostPaise)}</td>
                    <td className="py-2.5 text-right font-bold">₹{formatPaise(item.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "SLIP" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-porcelain-50 border border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-400 block uppercase">Carrier & Tracking</span>
                <span className="font-bold text-slate-800">
                  {documents.packingSlip.carrier || "Standard Freight"} ({documents.packingSlip.trackingNumber || "N/A"})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Packing Slip</span>
                <span className="font-bold text-slate-800">{documents.packingSlip.slipNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Dispatch Date</span>
                <span className="text-slate-700">{new Date(documents.packingSlip.shipDate).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Associated PO</span>
                <span className="text-slate-700">{documents.packingSlip.poNumber}</span>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                  <th className="py-2">SKU Identifier</th>
                  <th className="py-2">Lot Identifier</th>
                  <th className="py-2 text-center">Shipped Qty</th>
                  <th className="py-2 text-right">Invoiced Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.packingSlip.items.map((item) => (
                  <tr key={item.sku}>
                    <td className="py-2.5 font-bold text-slate-900">{item.sku}</td>
                    <td className="py-2.5 text-slate-500">{item.lotNumber || "STD-LOT-01"}</td>
                    <td className="py-2.5 text-center font-bold">{item.shippedQuantity}</td>
                    <td className="py-2.5 text-right font-bold">
                      {item.invoicedUnitCostPaise ? `₹${formatPaise(item.invoicedUnitCostPaise)}` : "As Contracted"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "LOG" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-porcelain-50 border border-slate-100 text-[11px]">
              <div>
                <span className="text-slate-400 block uppercase">Warehouse Facility</span>
                <span className="font-bold text-slate-800">{documents.receivingLog.warehouseName}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Inspector</span>
                <span className="font-bold text-slate-800">{documents.receivingLog.inspectorName}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Scan Timestamp</span>
                <span className="text-slate-700">{new Date(documents.receivingLog.scanDate).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase">Dock Door</span>
                <span className="text-slate-700">{documents.receivingLog.dockDoor || "Dock 01"}</span>
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase">
                  <th className="py-2">SKU Identifier</th>
                  <th className="py-2">Scanned Barcode</th>
                  <th className="py-2 text-center">Physical Count</th>
                  <th className="py-2 text-center">Damaged Count</th>
                  <th className="py-2">Inspection Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {documents.receivingLog.items.map((item) => (
                  <tr key={item.sku}>
                    <td className="py-2.5 font-bold text-slate-900">{item.sku}</td>
                    <td className="py-2.5 text-slate-500">{item.barcode || "N/A"}</td>
                    <td className="py-2.5 text-center font-bold text-slate-900">{item.receivedQuantity}</td>
                    <td className="py-2.5 text-center font-bold text-red-600">{item.damagedQuantity}</td>
                    <td className="py-2.5 text-slate-600 font-sans text-[11px] max-w-sm truncate">
                      {item.conditionNotes || "Conforming package."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
