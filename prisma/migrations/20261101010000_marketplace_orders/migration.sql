CREATE TABLE "marketplace_listings" (
  "id" TEXT NOT NULL, "builderId" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT NOT NULL, "category" TEXT NOT NULL, "endpointUrl" TEXT NOT NULL,
  "inputSchema" JSONB NOT NULL, "outputSchema" JSONB NOT NULL, "review" JSONB NOT NULL, "pricePaise" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "marketplace_listings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "marketplace_listings_status_createdAt_idx" ON "marketplace_listings"("status", "createdAt");
CREATE INDEX "marketplace_listings_builderId_createdAt_idx" ON "marketplace_listings"("builderId", "createdAt");
CREATE TABLE "marketplace_orders" (
  "id" TEXT NOT NULL, "listingId" TEXT NOT NULL, "buyerId" TEXT NOT NULL, "requestId" TEXT NOT NULL,
  "task" TEXT NOT NULL, "pricePaise" INTEGER NOT NULL, "paymentStatus" TEXT NOT NULL DEFAULT 'DEMO_BYPASSED',
  "status" TEXT NOT NULL DEFAULT 'PENDING', "result" JSONB, "errorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "marketplace_orders_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "marketplace_orders_buyerId_requestId_key" ON "marketplace_orders"("buyerId", "requestId");
CREATE INDEX "marketplace_orders_buyerId_createdAt_idx" ON "marketplace_orders"("buyerId", "createdAt");
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
