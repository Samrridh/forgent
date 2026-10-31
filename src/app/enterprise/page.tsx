import type { Metadata } from "next";
import { BusinessDashboard } from "@/components/business/business-dashboard";

export const metadata: Metadata = {
  title: "Enterprise workspace — Forgent",
  description: "Describe a job and review suggested agent workflows.",
};

export default function EnterprisePage() {
  return <section id="workspace" aria-label="Business workspace"><BusinessDashboard /></section>;
}
