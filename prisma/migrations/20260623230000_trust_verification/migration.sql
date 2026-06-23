ALTER TABLE "Customer" ADD COLUMN "verificationTier" TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE "Customer" ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN "photoVerifiedAt" TIMESTAMP(3);

ALTER TABLE "OrgMatchingConfig" ADD COLUMN "blockSameGotra" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "VerificationAttempt" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "failCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationAttempt_target_channel_idx" ON "VerificationAttempt"("target", "channel");
CREATE INDEX "VerificationAttempt_clientId_createdAt_idx" ON "VerificationAttempt"("clientId", "createdAt");

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "reviewerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

ALTER TABLE "VerificationAttempt" ADD CONSTRAINT "VerificationAttempt_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
