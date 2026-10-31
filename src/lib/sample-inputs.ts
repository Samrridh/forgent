import { AgentPortfolioData } from "./agent-portfolio";

export const CATEGORY_SAMPLE_INPUTS: Record<string, Record<string, unknown>> = {
  Finance: {
    ticker: "NVDA",
    fiscalYear: 2024,
    filingType: "10-K",
    extractMdnaRisks: true,
    reconciliationThresholdUsd: 0.01,
    targetAuditPeriod: "FY2024-Q4",
  },
  Legal: {
    contractType: "MUTUAL_NDA",
    jurisdiction: "STATE_OF_DELAWARE",
    governingLaw: "Delaware Corporate Law",
    confidentialityTermYears: 3,
    markedClauseSample:
      "Recipient shall protect Confidential Information with the same degree of care it uses for its own sensitive data, but in no event less than reasonable care.",
    flagNonStandardIndemnity: true,
  },
  DevOps: {
    clusterName: "prod-us-east-cluster-01",
    namespace: "billing-workloads",
    podName: "transaction-processor-77bfd4b99-92kmz",
    restartCount: 5,
    lastExitCode: 137,
    reason: "OOMKilled",
    memoryLimitMb: 1024,
    recommendedScanDepth: "DEEP_LOG_ANALYSIS",
  },
  Healthcare: {
    resourceType: "PatientObservation",
    fhirVersion: "R4",
    patientIdentifier: "urn:uuid:7c9e6679-7425-40de-9444-e07e305ff7cc",
    codeSystem: "http://loinc.org",
    observationCode: "883-9",
    metricValue: 12.4,
    metricUnit: "g/dL",
    referenceRangeLow: 13.8,
    referenceRangeHigh: 17.2,
    anonymizePhi: true,
  },
  Data: {
    pipelineId: "pipe_snowflake_lakehouse_sync",
    sourceSchema: "RAW_INGEST_V2",
    targetTable: "ANALYTICS.FACT_ORDER_TRANSACTIONS",
    discrepancyCheckMode: "EXACT_CANONICAL_ROW_COUNT",
    expectedRowBatchCount: 1500000,
    varianceThresholdBps: 0,
  },
  Cybersecurity: {
    targetDomain: "api.internal.forgent.dev",
    auditStandard: "SOC2_TRUST_SERVICES_CRITERIA",
    tlsMinimumProtocol: "TLS_1_3",
    scanWildcardCertificates: true,
    strictTransportSecurityEnforced: true,
    maxPermittedCipherSuites: 4,
  },
  "E-Commerce": {
    merchantId: "merch_acme_retail_india",
    skuBatchId: "BATCH-2026-SKU-9912",
    declaredWarehouseUnits: 4200,
    physicalBarcodeScanUnits: 4200,
    gstinJurisdictionCode: "27AAPCA1234F1Z5",
    toleranceUnitsAllowed: 0,
  },
  "Customer Support": {
    ticketId: "TICK-90812",
    priority: "URGENT",
    customerTier: "ENTERPRISE_SLA",
    slaRemainingMinutes: 45,
    sentimentScore: -0.82,
    reportedIssue: "Payment webhook callback timed out with HTTP 504 during settlement reconciliation.",
    automatedRoutingTarget: "TIER_3_PAYMENTS_SRE",
  },
  HR: {
    candidateId: "CAND-2026-904",
    requisitionId: "REQ-ENG-SENIOR-DISTRIBUTED",
    backgroundCheckStatus: "CLEAR",
    employmentVerificationCompleted: true,
    jurisdictionLaborCode: "CA-AB-5",
    severanceDisclosureStandard: "ADEA_OWBPA_COMPLIANT",
  },
  Research: {
    doiIdentifier: "10.1145/3318464.3389700",
    citationFormat: "BIBTEX",
    extractMethodologySection: true,
    validateReplicationArtifacts: true,
    statisticalSignificanceThreshold: 0.05,
  },
  Growth: {
    campaignId: "cmp_q4_enterprise_seed",
    attributionModel: "FIRST_TOUCH_CANONICAL",
    cacCeilingUsd: 120.0,
    targetLtvUsd: 1800.0,
    trackingPixelValidation: true,
  },
};

export function getSampleInputForAgent(agent: AgentPortfolioData): Record<string, unknown> {
  // If agent has defined sampleInputs in catalog, use them
  if (agent.sampleInputs && Object.keys(agent.sampleInputs).length > 0) {
    return agent.sampleInputs;
  }

  // Else check category-specific preset
  const categoryPreset = CATEGORY_SAMPLE_INPUTS[agent.category];
  if (categoryPreset) {
    return categoryPreset;
  }

  // Fallback realistic generic task input
  return {
    taskId: `task_${agent.slug}_${Date.now()}`,
    mode: "STRICT_CANONICAL_EXECUTION",
    targetEntity: agent.title,
    parameters: {
      priority: "HIGH",
      auditVerification: true,
      toleranceThreshold: 0.0,
    },
  };
}
