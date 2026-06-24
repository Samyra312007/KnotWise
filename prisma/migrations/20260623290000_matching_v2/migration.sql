ALTER TABLE "OrgMatchingConfig" ADD COLUMN "kundliEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "OrgMatchingConfig" ADD COLUMN "weightPreset" TEXT NOT NULL DEFAULT 'v1';
ALTER TABLE "OrgMatchingConfig" ADD COLUMN "experimentVariant" TEXT NOT NULL DEFAULT 'control';

CREATE TABLE "PreferenceSignal" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "poolProfileId" TEXT,
    "suggestionId" TEXT,
    "signalType" TEXT NOT NULL,
    "dwellMs" INTEGER,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreferenceSignal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AstroProfile" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "birthTime" TEXT,
    "birthPlace" TEXT,
    "consentAt" TIMESTAMP(3),
    "kundliJson" TEXT,
    "fetchedAt" TIMESTAMP(3),

    CONSTRAINT "AstroProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchExperiment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "configJson" TEXT NOT NULL DEFAULT '{}',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "MatchExperiment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PreferenceSignal_customerId_createdAt_idx" ON "PreferenceSignal"("customerId", "createdAt");
CREATE INDEX "PreferenceSignal_poolProfileId_idx" ON "PreferenceSignal"("poolProfileId");
CREATE UNIQUE INDEX "AstroProfile_entityType_entityId_key" ON "AstroProfile"("entityType", "entityId");
CREATE UNIQUE INDEX "MatchExperiment_orgId_key_key" ON "MatchExperiment"("orgId", "key");

ALTER TABLE "PreferenceSignal" ADD CONSTRAINT "PreferenceSignal_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchExperiment" ADD CONSTRAINT "MatchExperiment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
