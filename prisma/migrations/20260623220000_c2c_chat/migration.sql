CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "mutualMatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversation_mutualMatchId_key" ON "Conversation"("mutualMatchId");

CREATE TABLE "C2cMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "C2cMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "C2cMessage_conversationId_createdAt_idx" ON "C2cMessage"("conversationId", "createdAt");

CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_mutualMatchId_fkey" FOREIGN KEY ("mutualMatchId") REFERENCES "MutualMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "C2cMessage" ADD CONSTRAINT "C2cMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "C2cMessage" ADD CONSTRAINT "C2cMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
