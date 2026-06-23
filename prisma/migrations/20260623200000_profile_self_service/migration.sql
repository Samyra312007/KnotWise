ALTER TABLE "Asset" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'photo';

DROP INDEX IF EXISTS "Asset_entityType_entityId_idx";
CREATE INDEX "Asset_entityType_entityId_kind_idx" ON "Asset"("entityType", "entityId", "kind");

CREATE TABLE "ProfileRevision" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "fieldPath" TEXT NOT NULL,
    "oldValue" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ProfileRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProfileRevision_customerId_status_idx" ON "ProfileRevision"("customerId", "status");
CREATE INDEX "ProfileRevision_status_createdAt_idx" ON "ProfileRevision"("status", "createdAt");

ALTER TABLE "ProfileRevision" ADD CONSTRAINT "ProfileRevision_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
