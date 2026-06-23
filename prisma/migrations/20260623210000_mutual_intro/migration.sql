ALTER TABLE "PoolProfile" ADD COLUMN "linkedCustomerId" TEXT;

CREATE UNIQUE INDEX "PoolProfile_linkedCustomerId_key" ON "PoolProfile"("linkedCustomerId");

ALTER TABLE "PoolProfile" ADD CONSTRAINT "PoolProfile_linkedCustomerId_fkey" FOREIGN KEY ("linkedCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MatchSuggestion" ADD COLUMN "viewedAt" TIMESTAMP(3);
ALTER TABLE "MatchSuggestion" ADD COLUMN "introPairId" TEXT;

CREATE INDEX "MatchSuggestion_introPairId_idx" ON "MatchSuggestion"("introPairId");

CREATE TABLE "MutualMatch" (
    "id" TEXT NOT NULL,
    "matchSuggestionId" TEXT NOT NULL,
    "introPairId" TEXT,
    "clientAId" TEXT NOT NULL,
    "clientBId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "contactSharedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MutualMatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MutualMatch_matchSuggestionId_key" ON "MutualMatch"("matchSuggestionId");
CREATE INDEX "MutualMatch_clientAId_idx" ON "MutualMatch"("clientAId");
CREATE INDEX "MutualMatch_clientBId_idx" ON "MutualMatch"("clientBId");
CREATE INDEX "MutualMatch_introPairId_idx" ON "MutualMatch"("introPairId");

ALTER TABLE "MutualMatch" ADD CONSTRAINT "MutualMatch_matchSuggestionId_fkey" FOREIGN KEY ("matchSuggestionId") REFERENCES "MatchSuggestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MutualMatch" ADD CONSTRAINT "MutualMatch_clientAId_fkey" FOREIGN KEY ("clientAId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MutualMatch" ADD CONSTRAINT "MutualMatch_clientBId_fkey" FOREIGN KEY ("clientBId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
