import { Metadata } from "next";
import { EnterprisePortal } from "@/components/enterprise/enterprise-portal";

export const metadata: Metadata = {
  title: "Enterprise Hub — Forgent Command Centre",
  description:
    "Construct multi-agent DAG pipelines, run synthetic test flights, and manage departmental escrow spend.",
};

export default function BuyerOverviewPage() {
  return <EnterprisePortal />;
}
