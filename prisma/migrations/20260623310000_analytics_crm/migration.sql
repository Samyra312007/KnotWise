CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "customerId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "properties" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmLead" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'lead',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "source" TEXT NOT NULL DEFAULT 'signup',
    "notes" TEXT,
    "lastContactAt" TIMESTAMP(3),
    "nextFollowUpAt" TIMESTAMP(3),
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrmLead_customerId_key" ON "CrmLead"("customerId");
CREATE INDEX "AnalyticsEvent_orgId_eventName_createdAt_idx" ON "AnalyticsEvent"("orgId", "eventName", "createdAt");
CREATE INDEX "AnalyticsEvent_orgId_createdAt_idx" ON "AnalyticsEvent"("orgId", "createdAt");
CREATE INDEX "CrmLead_orgId_stage_idx" ON "CrmLead"("orgId", "stage");
CREATE INDEX "CrmLead_orgId_nextFollowUpAt_idx" ON "CrmLead"("orgId", "nextFollowUpAt");

ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrmLead" ADD CONSTRAINT "CrmLead_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Matchmaker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
