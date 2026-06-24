CREATE TABLE "ScheduledEvent" (
    "id" TEXT NOT NULL,
    "mutualMatchId" TEXT NOT NULL,
    "proposedById" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "mode" TEXT NOT NULL DEFAULT 'video',
    "title" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "videoLink" TEXT,
    "videoRoomId" TEXT,
    "videoProvider" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduledEvent_mutualMatchId_status_idx" ON "ScheduledEvent"("mutualMatchId", "status");
CREATE INDEX "ScheduledEvent_startsAt_status_idx" ON "ScheduledEvent"("startsAt", "status");

ALTER TABLE "ScheduledEvent" ADD CONSTRAINT "ScheduledEvent_mutualMatchId_fkey" FOREIGN KEY ("mutualMatchId") REFERENCES "MutualMatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledEvent" ADD CONSTRAINT "ScheduledEvent_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
