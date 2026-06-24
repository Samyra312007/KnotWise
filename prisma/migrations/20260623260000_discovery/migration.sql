ALTER TABLE "OrgMatchingConfig" ADD COLUMN "discoveryEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OrgMatchingConfig" ADD COLUMN "discoveryDailyLimit" INTEGER NOT NULL DEFAULT 20;

ALTER TABLE "PoolProfile" ADD COLUMN "searchText" TEXT;

CREATE TABLE "DiscoveryInterest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "poolProfileId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscoveryInterest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DiscoveryInterest_customerId_poolProfileId_key" ON "DiscoveryInterest"("customerId", "poolProfileId");
CREATE INDEX "DiscoveryInterest_customerId_createdAt_idx" ON "DiscoveryInterest"("customerId", "createdAt");
CREATE INDEX "DiscoveryInterest_status_createdAt_idx" ON "DiscoveryInterest"("status", "createdAt");

ALTER TABLE "DiscoveryInterest" ADD CONSTRAINT "DiscoveryInterest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DiscoveryInterest" ADD CONSTRAINT "DiscoveryInterest_poolProfileId_fkey" FOREIGN KEY ("poolProfileId") REFERENCES "PoolProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "PoolProfile_searchText_idx" ON "PoolProfile" USING gin(to_tsvector('english', coalesce("searchText", '')));
