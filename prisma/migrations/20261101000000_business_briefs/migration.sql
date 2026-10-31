CREATE TABLE "business_briefs" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "objective" TEXT NOT NULL,
  "requirements" JSONB NOT NULL,
  "dataSchema" JSONB NOT NULL,
  "candidates" JSONB NOT NULL,
  "compilerMode" TEXT NOT NULL,
  "selectedId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "business_briefs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "business_briefs_organizationId_ownerId_createdAt_idx" ON "business_briefs"("organizationId", "ownerId", "createdAt");
