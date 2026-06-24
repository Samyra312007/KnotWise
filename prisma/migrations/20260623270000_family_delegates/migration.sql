ALTER TABLE "ClientAccount" ADD COLUMN "delegateApproverOptIn" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "FamilyDelegate" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "inviteTokenHash" TEXT,

    CONSTRAINT "FamilyDelegate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DelegateMagicLinkToken" (
    "id" TEXT NOT NULL,
    "delegateId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DelegateMagicLinkToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DelegateAuthToken" (
    "id" TEXT NOT NULL,
    "delegateId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "DelegateAuthToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FamilyDelegate_customerId_email_key" ON "FamilyDelegate"("customerId", "email");
CREATE INDEX "FamilyDelegate_email_status_idx" ON "FamilyDelegate"("email", "status");
CREATE UNIQUE INDEX "DelegateMagicLinkToken_tokenHash_key" ON "DelegateMagicLinkToken"("tokenHash");
CREATE INDEX "DelegateMagicLinkToken_delegateId_idx" ON "DelegateMagicLinkToken"("delegateId");
CREATE UNIQUE INDEX "DelegateAuthToken_tokenHash_key" ON "DelegateAuthToken"("tokenHash");
CREATE INDEX "DelegateAuthToken_delegateId_idx" ON "DelegateAuthToken"("delegateId");

ALTER TABLE "FamilyDelegate" ADD CONSTRAINT "FamilyDelegate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DelegateMagicLinkToken" ADD CONSTRAINT "DelegateMagicLinkToken_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "FamilyDelegate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DelegateAuthToken" ADD CONSTRAINT "DelegateAuthToken_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "FamilyDelegate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
