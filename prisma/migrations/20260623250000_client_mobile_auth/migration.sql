CREATE TABLE "ClientMobileAuthToken" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ClientMobileAuthToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClientMobileAuthToken_tokenHash_key" ON "ClientMobileAuthToken"("tokenHash");
CREATE INDEX "ClientMobileAuthToken_clientId_idx" ON "ClientMobileAuthToken"("clientId");

ALTER TABLE "ClientMobileAuthToken" ADD CONSTRAINT "ClientMobileAuthToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "ClientAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
