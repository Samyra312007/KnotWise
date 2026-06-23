ALTER TABLE "ClientAccount" ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ClientAccount" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);
