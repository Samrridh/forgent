-- CreateIndex
CREATE UNIQUE INDEX "acceptance_checks_acceptanceResultId_code_key" ON "acceptance_checks"("acceptanceResultId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "acceptance_contracts_jobId_version_key" ON "acceptance_contracts"("jobId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "acceptance_results_executionId_key" ON "acceptance_results"("executionId");

-- CreateIndex
CREATE INDEX "agent_versions_agentId_status_idx" ON "agent_versions"("agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "agent_versions_agentId_version_key" ON "agent_versions"("agentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_stages_candidateId_nodeId_key" ON "candidate_stages"("candidateId", "nodeId");

-- CreateIndex
CREATE INDEX "contribution_records_builderId_status_idx" ON "contribution_records"("builderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "contribution_records_executionId_stageId_key" ON "contribution_records"("executionId", "stageId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_fixture_results_evaluationRunId_fixtureId_key" ON "evaluation_fixture_results"("evaluationRunId", "fixtureId");

-- CreateIndex
CREATE UNIQUE INDEX "evaluation_runs_jobId_candidateId_suiteVersion_runNumber_key" ON "evaluation_runs"("jobId", "candidateId", "suiteVersion", "runNumber");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_receipts_executionId_key" ON "evidence_receipts"("executionId");

-- CreateIndex
CREATE INDEX "execution_events_executionId_createdAt_idx" ON "execution_events"("executionId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "execution_events_executionId_sequence_key" ON "execution_events"("executionId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "execution_events_executionId_idempotencyKey_key" ON "execution_events"("executionId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "execution_runs_jobId_status_idx" ON "execution_runs"("jobId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_scope_key_key" ON "idempotency_records"("scope", "key");

-- CreateIndex
CREATE INDEX "jobs_buyerId_status_idx" ON "jobs"("buyerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_records_jobId_workOrderId_key" ON "settlement_records"("jobId", "workOrderId");

-- CreateIndex
CREATE INDEX "stage_runs_executionId_nodeId_idx" ON "stage_runs"("executionId", "nodeId");

-- CreateIndex
CREATE UNIQUE INDEX "stage_runs_executionId_nodeId_attempt_key" ON "stage_runs"("executionId", "nodeId", "attempt");

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_email_key" ON "user_accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_jobId_version_key" ON "work_orders"("jobId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_candidates_jobId_strategy_key" ON "workflow_candidates"("jobId", "strategy");

-- AddForeignKey
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("buyerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "builders"("builderId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "builders"("builderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agents"("agentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_package_artifacts" ADD CONSTRAINT "agent_package_artifacts_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "agent_versions"("versionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_package_artifacts" ADD CONSTRAINT "agent_package_artifacts_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "builders"("builderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_version_capabilities" ADD CONSTRAINT "agent_version_capabilities_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "agent_versions"("versionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_version_capabilities" ADD CONSTRAINT "agent_version_capabilities_capabilityKey_fkey" FOREIGN KEY ("capabilityKey") REFERENCES "capabilities"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_manifest_snapshots" ADD CONSTRAINT "agent_manifest_snapshots_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "agent_versions"("versionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyers"("buyerId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_contracts" ADD CONSTRAINT "acceptance_contracts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_candidates" ADD CONSTRAINT "workflow_candidates_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_stages" ADD CONSTRAINT "candidate_stages_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "workflow_candidates"("candidateId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_stages" ADD CONSTRAINT "candidate_stages_agentVersionId_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "agent_versions"("versionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_runs" ADD CONSTRAINT "evaluation_runs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_runs" ADD CONSTRAINT "evaluation_runs_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "workflow_candidates"("candidateId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_fixture_results" ADD CONSTRAINT "evaluation_fixture_results_evaluationRunId_fkey" FOREIGN KEY ("evaluationRunId") REFERENCES "evaluation_runs"("evaluationRunId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assertions" ADD CONSTRAINT "evaluation_assertions_evaluationRunId_fkey" FOREIGN KEY ("evaluationRunId") REFERENCES "evaluation_runs"("evaluationRunId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assertions" ADD CONSTRAINT "evaluation_assertions_fixtureResultId_fkey" FOREIGN KEY ("fixtureResultId") REFERENCES "evaluation_fixture_results"("fixtureResultId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "workflow_candidates"("candidateId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_allocations" ADD CONSTRAINT "work_order_allocations_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("workOrderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_allocations" ADD CONSTRAINT "work_order_allocations_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "builders"("builderId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_allocations" ADD CONSTRAINT "work_order_allocations_agentVersionId_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "agent_versions"("versionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_runs" ADD CONSTRAINT "execution_runs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_runs" ADD CONSTRAINT "execution_runs_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("workOrderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_runs" ADD CONSTRAINT "stage_runs_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_runs" ADD CONSTRAINT "stage_runs_agentVersionId_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "agent_versions"("versionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execution_events" ADD CONSTRAINT "execution_events_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_events" ADD CONSTRAINT "recovery_events_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_events" ADD CONSTRAINT "recovery_events_failedAgentVersionId_fkey" FOREIGN KEY ("failedAgentVersionId") REFERENCES "agent_versions"("versionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recovery_events" ADD CONSTRAINT "recovery_events_replacementAgentVersionId_fkey" FOREIGN KEY ("replacementAgentVersionId") REFERENCES "agent_versions"("versionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_results" ADD CONSTRAINT "acceptance_results_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_results" ADD CONSTRAINT "acceptance_results_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acceptance_checks" ADD CONSTRAINT "acceptance_checks_acceptanceResultId_fkey" FOREIGN KEY ("acceptanceResultId") REFERENCES "acceptance_results"("acceptanceResultId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_receipts" ADD CONSTRAINT "evidence_receipts_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_receipts" ADD CONSTRAINT "evidence_receipts_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_receipts" ADD CONSTRAINT "evidence_receipts_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("workOrderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_records" ADD CONSTRAINT "contribution_records_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_records" ADD CONSTRAINT "contribution_records_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "execution_runs"("executionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_records" ADD CONSTRAINT "contribution_records_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "builders"("builderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contribution_records" ADD CONSTRAINT "contribution_records_agentVersionId_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "agent_versions"("versionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_records" ADD CONSTRAINT "settlement_records_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_records" ADD CONSTRAINT "settlement_records_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("workOrderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_records" ADD CONSTRAINT "settlement_records_builderId_fkey" FOREIGN KEY ("builderId") REFERENCES "builders"("builderId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_version_stats" ADD CONSTRAINT "agent_version_stats_agentVersionId_fkey" FOREIGN KEY ("agentVersionId") REFERENCES "agent_versions"("versionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_ledger_entries" ADD CONSTRAINT "inventory_ledger_entries_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idempotency_records" ADD CONSTRAINT "idempotency_records_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("jobId") ON DELETE SET NULL ON UPDATE CASCADE;
