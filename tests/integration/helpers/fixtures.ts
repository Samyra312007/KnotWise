import crypto from "crypto";
import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";
import { makeBiodata } from "../../fixtures";

export type IntroPairFixture = {
  orgId: string;
  matchmakerId: string;
  clientA: { clientId: string; customerId: string; email: string; suggestionId: string };
  clientB: { clientId: string; customerId: string; email: string; suggestionId: string };
  introPairId: string;
};

export type MutualChatFixture = IntroPairFixture & {
  mutualMatchId: string;
  conversationId: string;
};

function suffix() {
  return crypto.randomBytes(4).toString("hex");
}

export async function createIntroPairFixture(prisma: PrismaClient): Promise<IntroPairFixture> {
  const id = suffix();
  const bioA = makeBiodata({
    firstName: "ClientA",
    email: `client-a-${id}@integration.test`,
    gender: "male",
  });
  const bioB = makeBiodata({
    firstName: "ClientB",
    email: `client-b-${id}@integration.test`,
    gender: "female",
  });

  const org = await prisma.organization.create({
    data: { name: `Integration Org ${id}`, slug: `int-${id}` },
  });

  const matchmaker = await prisma.matchmaker.create({
    data: {
      username: `mm-${id}`,
      passwordHash: await bcrypt.hash("password123", 10),
      fullName: "Integration Matchmaker",
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
      searchText: "client b integration",
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
      searchText: "client a integration",
    },
  });

  const introPairId = `int-pair-${id}`;

  const suggestionA = await prisma.matchSuggestion.create({
    data: {
      customerId: customerA.id,
      poolProfileId: poolB.id,
      score: 85,
      bucket: "high",
      explanation: "Integration test intro",
      breakdown: JSON.stringify({ city: 20 }),
      status: "sent",
      introPairId,
    },
  });

  const suggestionB = await prisma.matchSuggestion.create({
    data: {
      customerId: customerB.id,
      poolProfileId: poolA.id,
      score: 84,
      bucket: "high",
      explanation: "Integration test intro",
      breakdown: JSON.stringify({ city: 20 }),
      status: "sent",
      introPairId,
    },
  });

  return {
    orgId: org.id,
    matchmakerId: matchmaker.id,
    introPairId,
    clientA: {
      clientId: customerA.clientAccount!.id,
      customerId: customerA.id,
      email: customerA.clientAccount!.email,
      suggestionId: suggestionA.id,
    },
    clientB: {
      clientId: customerB.clientAccount!.id,
      customerId: customerB.id,
      email: customerB.clientAccount!.email,
      suggestionId: suggestionB.id,
    },
  };
}

export async function createMutualChatFixture(prisma: PrismaClient): Promise<MutualChatFixture> {
  const base = await createIntroPairFixture(prisma);
  const [clientAId, clientBId] =
    base.clientA.customerId < base.clientB.customerId
      ? [base.clientA.customerId, base.clientB.customerId]
      : [base.clientB.customerId, base.clientA.customerId];

  await prisma.matchSuggestion.updateMany({
    where: { id: { in: [base.clientA.suggestionId, base.clientB.suggestionId] } },
    data: { status: "mutual" },
  });

  const mutual = await prisma.mutualMatch.create({
    data: {
      matchSuggestionId: base.clientA.suggestionId,
      introPairId: base.introPairId,
      clientAId,
      clientBId,
      status: "active",
    },
  });

  const conversation = await prisma.conversation.create({
    data: { mutualMatchId: mutual.id },
  });

  return {
    ...base,
    mutualMatchId: mutual.id,
    conversationId: conversation.id,
  };
}

export async function deleteIntroPairFixture(prisma: PrismaClient, fixture: IntroPairFixture) {
  await prisma.organization.delete({ where: { id: fixture.orgId } }).catch(() => undefined);
  await prisma.matchmaker.delete({ where: { id: fixture.matchmakerId } }).catch(() => undefined);
}
