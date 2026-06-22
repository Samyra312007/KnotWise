-- CreateTable
CREATE TABLE "Matchmaker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchmakerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "maritalStatus" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'Onboarding',
    "biodata" TEXT NOT NULL,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Customer_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "Matchmaker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PoolProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "biodata" TEXT NOT NULL,
    "photoUrl" TEXT
);

-- CreateTable
CREATE TABLE "MatchSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "poolProfileId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "bucket" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "breakdown" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'shortlisted',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatchSuggestion_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchSuggestion_poolProfileId_fkey" FOREIGN KEY ("poolProfileId") REFERENCES "PoolProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "matchmakerId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Note_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "Matchmaker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchSuggestionId" TEXT NOT NULL,
    "matchmakerId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_matchSuggestionId_fkey" FOREIGN KEY ("matchSuggestionId") REFERENCES "MatchSuggestion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EmailLog_matchmakerId_fkey" FOREIGN KEY ("matchmakerId") REFERENCES "Matchmaker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Matchmaker_username_key" ON "Matchmaker"("username");

-- CreateIndex
CREATE INDEX "Customer_matchmakerId_idx" ON "Customer"("matchmakerId");

-- CreateIndex
CREATE INDEX "Customer_stage_idx" ON "Customer"("stage");

-- CreateIndex
CREATE INDEX "Customer_gender_idx" ON "Customer"("gender");

-- CreateIndex
CREATE INDEX "PoolProfile_gender_idx" ON "PoolProfile"("gender");

-- CreateIndex
CREATE INDEX "PoolProfile_city_idx" ON "PoolProfile"("city");

-- CreateIndex
CREATE INDEX "MatchSuggestion_customerId_status_idx" ON "MatchSuggestion"("customerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MatchSuggestion_customerId_poolProfileId_key" ON "MatchSuggestion"("customerId", "poolProfileId");

-- CreateIndex
CREATE INDEX "Note_customerId_createdAt_idx" ON "Note"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailLog_matchmakerId_sentAt_idx" ON "EmailLog"("matchmakerId", "sentAt");
