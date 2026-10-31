import { z } from "zod";
import * as schemas from "./schemas";

export type SessionPayload = z.infer<typeof schemas.SessionPayloadSchema>;
export type AcceptanceCheck = z.infer<typeof schemas.AcceptanceCheckSchema>;
export type AcceptanceContract = z.infer<typeof schemas.AcceptanceContractSchema>;
export type Job = z.infer<typeof schemas.JobSchema>;
export type AgentManifest = z.infer<typeof schemas.AgentManifestSchema>;
export type WorkflowStage = z.infer<typeof schemas.WorkflowStageSchema>;
export type WorkflowGraph = z.infer<typeof schemas.WorkflowGraphSchema>;
export type EvaluationRun = z.infer<typeof schemas.EvaluationRunSchema>;
export type ExecutionEvent = z.infer<typeof schemas.ExecutionEventSchema>;
export type RecoveryEvent = z.infer<typeof schemas.RecoveryEventSchema>;
export type EvidenceReceipt = z.infer<typeof schemas.EvidenceReceiptSchema>;
export type WH204Truth = z.infer<typeof schemas.WH204TruthSchema>;
export type ErrorEnvelope = z.infer<typeof schemas.ErrorEnvelopeSchema>;

export type UserRole = z.infer<typeof schemas.UserRoleSchema>;
export type CapabilityKey = z.infer<typeof schemas.CapabilityKeySchema>;
export type PermissionKey = z.infer<typeof schemas.PermissionKeySchema>;
export type JobStatus = z.infer<typeof schemas.JobStatusSchema>;
export type StageStatus = z.infer<typeof schemas.StageStatusSchema>;
export type ExecutionStatus = z.infer<typeof schemas.ExecutionStatusSchema>;
export type PackageSubmissionStatus = z.infer<typeof schemas.PackageSubmissionStatusSchema>;
export type AcceptanceCheckCode = z.infer<typeof schemas.AcceptanceCheckCodeSchema>;
