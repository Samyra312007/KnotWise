import crypto from "crypto";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { makeBiodata } from "../tests/fixtures";
import { hashToken } from "../lib/auth/token-hash";

export default async function globalSetup() {
  const statePath = path.join(__dirname, ".e2e-state.json");

  if (!process.env.DATABASE_URL) {
    fs.writeFileSync(statePath, JSON.stringify({ skipped: true }));
    return;
  }

  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    fs.writeFileSync(statePath, JSON.stringify({ skipped: true }));
    await prisma.$disconnect();
    return;
  }

  const id = crypto.randomBytes(4).toString("hex");
  const bioA = makeBiodata({ firstName: "E2EAlice", email: `e2e-a-${id}@test.local`, gender: "male" });
  const bioB = makeBiodata({ firstName: "E2EBob", email: `e2e-b-${id}@test.local`, gender: "female" });

  const org = await prisma.organization.create({
    data: { name: `E2E Org ${id}`, slug: `e2e-${id}` },
  });

  const matchmaker = await prisma.matchmaker.create({
    data: {
      username: `e2e-mm-${id}`,
      passwordHash: await bcrypt.hash("password123", 10),
      fullName: "E2E Matchmaker",
      memberships: { create: { orgId: org.id, role: "matchmaker" } },
    },
  });

  const customerA = await prisma.customer.create({
    data: {
      orgId: org.id,
      firstName: bioA.firstName,
      lastName: bioA.lastName,
      gender: bioA.gender,
      dateOfBirth: new Date(bioA.dateOfBirth),
      city: bioA.city,
      country: bioA.country,
      maritalStatus: bioA.maritalStatus,
      stage: "Match Sent",
      biodata: JSON.stringify(bioA),
      assignments: { create: { matchmakerId: matchmaker.id, role: "primary" } },
      clientAccount: {
        create: {
          email: bioA.email.toLowerCase(),
          emailVerifiedAt: new Date(),
          onboardingCompletedAt: new Date(),
          onboardingStep: 6,
        },
      },
    },
    include: { clientAccount: true },
  });

  const customerB = await prisma.customer.create({
    data: {
      orgId: org.id,
      firstName: bioB.firstName,
      lastName: bioB.lastName,
      gender: bioB.gender,
      dateOfBirth: new Date(bioB.dateOfBirth),
      city: bioB.city,
      country: bioB.country,
      maritalStatus: bioB.maritalStatus,
      stage: "Match Sent",
      biodata: JSON.stringify(bioB),
      assignments: { create: { matchmakerId: matchmaker.id, role: "primary" } },
      clientAccount: {
        create: {
          email: bioB.email.toLowerCase(),
          emailVerifiedAt: new Date(),
          onboardingCompletedAt: new Date(),
          onboardingStep: 6,
        },
      },
    },
    include: { clientAccount: true },
  });

  const poolB = await prisma.poolProfile.create({
    data: {
      orgId: org.id,
      firstName: bioB.firstName,
      lastName: bioB.lastName,
      gender: bioB.gender,
      dateOfBirth: new Date(bioB.dateOfBirth),
      city: bioB.city,
      country: bioB.country,
      biodata: JSON.stringify(bioB),
      linkedCustomerId: customerB.id,
      searchText: "e2e b",
    },
  });

  const poolA = await prisma.poolProfile.create({
    data: {
      orgId: org.id,
      firstName: bioA.firstName,
      lastName: bioA.lastName,
      gender: bioA.gender,
      dateOfBirth: new Date(bioA.dateOfBirth),
      city: bioA.city,
      country: bioA.country,
      biodata: JSON.stringify(bioA),
      linkedCustomerId: customerA.id,
      searchText: "e2e a",
    },
  });

  const introPairId = `e2e-pair-${id}`;
  const suggestionA = await prisma.matchSuggestion.create({
    data: {
      customerId: customerA.id,
      poolProfileId: poolB.id,
      score: 88,
      bucket: "high",
      explanation: "E2E intro",
      breakdown: JSON.stringify({ city: 20 }),
      status: "sent",
      introPairId,
    },
  });

  const suggestionB = await prisma.matchSuggestion.create({
    data: {
      customerId: customerB.id,
      poolProfileId: poolA.id,
      score: 87,
      bucket: "high",
      explanation: "E2E intro",
      breakdown: JSON.stringify({ city: 20 }),
      status: "sent",
      introPairId,
    },
  });

  const tokenA = crypto.randomBytes(32).toString("hex");
  const tokenB = crypto.randomBytes(32).toString("hex");
  await prisma.magicLinkToken.createMany({
    data: [
      {
        clientId: customerA.clientAccount!.id,
        tokenHash: hashToken(tokenA),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
      {
        clientId: customerB.clientAccount!.id,
        tokenHash: hashToken(tokenB),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    ],
  });

  fs.writeFileSync(
    statePath,
    JSON.stringify({
      orgId: org.id,
      matchmakerId: matchmaker.id,
      tokenA,
      tokenB,
      suggestionAId: suggestionA.id,
      suggestionBId: suggestionB.id,
    })
  );

  await prisma.$disconnect();
}
