ALTER TABLE "ClientBilling" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "ClientBilling" ADD COLUMN "razorpayCustomerId" TEXT;
ALTER TABLE "ClientBilling" ADD COLUMN "razorpaySubscriptionId" TEXT;
ALTER TABLE "ClientBilling" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "ClientBilling" ADD COLUMN "gstin" TEXT;
ALTER TABLE "ClientBilling" ADD COLUMN "introRequestsPeriod" TEXT;
ALTER TABLE "ClientBilling" ADD COLUMN "introRequestsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ClientBilling" ADD COLUMN "pastDueSince" TIMESTAMP(3);
ALTER TABLE "ClientBilling" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ClientBilling" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "ClientBilling_razorpaySubscriptionId_key" ON "ClientBilling"("razorpaySubscriptionId");

ALTER TABLE "VerificationCase" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "BillingCheckoutSession" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amountInr" INTEGER NOT NULL,
    "razorpayOrderId" TEXT,
    "razorpaySubId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "BillingCheckoutSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" TEXT,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientBillingInvoice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "amountInr" INTEGER NOT NULL,
    "gstInr" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "invoiceUrl" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientBillingInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClientIntroRequest" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientIntroRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingCheckoutSession_idempotencyKey_key" ON "BillingCheckoutSession"("idempotencyKey");
CREATE UNIQUE INDEX "BillingCheckoutSession_razorpayOrderId_key" ON "BillingCheckoutSession"("razorpayOrderId");
CREATE INDEX "BillingCheckoutSession_customerId_idx" ON "BillingCheckoutSession"("customerId");
CREATE UNIQUE INDEX "BillingWebhookEvent_provider_eventId_key" ON "BillingWebhookEvent"("provider", "eventId");
CREATE UNIQUE INDEX "ClientBillingInvoice_provider_externalId_key" ON "ClientBillingInvoice"("provider", "externalId");
CREATE INDEX "ClientBillingInvoice_customerId_idx" ON "ClientBillingInvoice"("customerId");
CREATE INDEX "ClientIntroRequest_customerId_createdAt_idx" ON "ClientIntroRequest"("customerId", "createdAt");

ALTER TABLE "BillingCheckoutSession" ADD CONSTRAINT "BillingCheckoutSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientBillingInvoice" ADD CONSTRAINT "ClientBillingInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClientIntroRequest" ADD CONSTRAINT "ClientIntroRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
