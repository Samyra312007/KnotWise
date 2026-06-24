import { prisma } from "@/lib/db";

export type FunnelStep = {
  key: string;
  label: string;
  count: number;
  rateFromPrevious: number | null;
};

export async function computeEngagedCustomerIds(orgId: string): Promise<Set<string>> {
  const engaged = new Set<string>();

  const messageCounts = await prisma.c2cMessage.groupBy({
    by: ["senderId"],
    where: { sender: { orgId } },
    _count: { id: true },
  });
  for (const row of messageCounts) {
    if (row._count.id >= 5) engaged.add(row.senderId);
  }

  const scheduled = await prisma.scheduledEvent.findMany({
    where: {
      status: "accepted",
      mutualMatch: {
        OR: [{ clientA: { orgId } }, { clientB: { orgId } }],
      },
    },
    select: {
      mutualMatch: { select: { clientAId: true, clientBId: true } },
    },
  });
  for (const row of scheduled) {
    engaged.add(row.mutualMatch.clientAId);
    engaged.add(row.mutualMatch.clientBId);
  }

  return engaged;
}

export async function computeFunnel(orgId: string): Promise<FunnelStep[]> {
  const signup = await prisma.clientAccount.count({
    where: { customer: { orgId } },
  });

  const verified = await prisma.customer.count({
    where: {
      orgId,
      OR: [{ verifiedAt: { not: null } }, { verificationTier: { not: "unverified" } }],
    },
  });

  const firstIntro = await prisma.customer.count({
    where: {
      orgId,
      suggestions: {
        some: { status: { in: ["sent", "viewed", "accepted", "declined", "mutual"] } },
      },
    },
  });

  const accepted = await prisma.matchSuggestion.count({
    where: {
      customer: { orgId },
      status: { in: ["accepted", "mutual"] },
    },
  });

  const mutual = await prisma.mutualMatch.count({
    where: {
      OR: [{ clientA: { orgId } }, { clientB: { orgId } }],
    },
  });

  const engagedIds = await computeEngagedCustomerIds(orgId);
  const engaged = engagedIds.size;

  const steps: Array<{ key: string; label: string; count: number }> = [
    { key: "signup", label: "Signup", count: signup },
    { key: "verified", label: "Verified", count: verified },
    { key: "firstIntro", label: "First intro", count: firstIntro },
    { key: "accepted", label: "Accepted", count: accepted },
    { key: "mutual", label: "Mutual", count: mutual },
    { key: "engaged", label: "Engaged", count: engaged },
  ];

  return steps.map((step, index) => {
    const prev = index > 0 ? steps[index - 1].count : null;
    const rateFromPrevious =
      prev != null && prev > 0 ? Math.round((step.count / prev) * 1000) / 10 : null;
    return { ...step, rateFromPrevious };
  });
}
