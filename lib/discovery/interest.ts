import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getPrimaryMatchmakerId } from "@/lib/access/customers";
import type { Biodata } from "@/lib/types";

export async function expressDiscoveryInterest(input: {
  customerId: string;
  orgId: string;
  clientId: string;
  poolProfileId: string;
  note?: string;
}) {
  const config = await prisma.orgMatchingConfig.findUnique({ where: { orgId: input.orgId } });
  if (config && !config.discoveryEnabled) {
    throw new Error("DISABLED");
  }

  const dailyLimit = config?.discoveryDailyLimit ?? 20;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayCount = await prisma.discoveryInterest.count({
    where: {
      customerId: input.customerId,
      createdAt: { gte: startOfDay },
    },
  });

  if (todayCount >= dailyLimit) {
    throw new Error("RATE_LIMIT");
  }

  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  if (!customer) throw new Error("NOT_FOUND");

  const profile = await prisma.poolProfile.findFirst({
    where: { id: input.poolProfileId, orgId: input.orgId },
  });
  if (!profile) throw new Error("NOT_FOUND");

  if (profile.linkedCustomerId === input.customerId) {
    throw new Error("SELF");
  }

  const existingIntro = await prisma.matchSuggestion.findUnique({
    where: {
      customerId_poolProfileId: {
        customerId: input.customerId,
        poolProfileId: input.poolProfileId,
      },
    },
  });
  if (existingIntro) throw new Error("ALREADY_INTRODUCED");

  const interest = await prisma.discoveryInterest.upsert({
    where: {
      customerId_poolProfileId: {
        customerId: input.customerId,
        poolProfileId: input.poolProfileId,
      },
    },
    update: {
      note: input.note,
      status: "pending",
    },
    create: {
      customerId: input.customerId,
      poolProfileId: input.poolProfileId,
      note: input.note,
      status: "pending",
    },
  });

  const biodata = JSON.parse(profile.biodata) as Biodata;
  const mmId = await getPrimaryMatchmakerId(input.customerId);
  if (mmId) {
    await createNotification(mmId, "discovery_interest", {
      customerId: input.customerId,
      poolProfileId: input.poolProfileId,
      interestId: interest.id,
      candidateName: `${biodata.firstName} ${biodata.lastName}`,
      note: input.note,
    });
  }

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: "discovery.interest",
    entityType: "pool_profile",
    entityId: input.poolProfileId,
    metadata: { interestId: interest.id },
  });

  return interest;
}

export async function listDiscoveryInterestsForCustomer(customerId: string) {
  return prisma.discoveryInterest.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      poolProfileId: true,
      status: true,
      createdAt: true,
    },
  });
}
