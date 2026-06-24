import { prisma } from "@/lib/db";

export async function computeMatchmakerDashboard(orgId: string, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const clientsByStage = await prisma.customer.groupBy({
    by: ["stage"],
    where: { orgId },
    _count: { id: true },
  });

  const introsSent = await prisma.matchSuggestion.count({
    where: {
      customer: { orgId },
      createdAt: { gte: since },
      status: { in: ["sent", "viewed", "accepted", "declined", "mutual"] },
    },
  });

  const introsAccepted = await prisma.matchSuggestion.count({
    where: {
      customer: { orgId },
      createdAt: { gte: since },
      status: { in: ["accepted", "mutual"] },
    },
  });

  const mutualCount = await prisma.mutualMatch.count({
    where: {
      createdAt: { gte: since },
      OR: [{ clientA: { orgId } }, { clientB: { orgId } }],
    },
  });

  const acceptanceRate =
    introsSent > 0 ? Math.round((introsAccepted / introsSent) * 1000) / 10 : null;
  const mutualRate =
    introsAccepted > 0 ? Math.round((mutualCount / introsAccepted) * 1000) / 10 : null;

  const recentMutuals = await prisma.mutualMatch.findMany({
    where: {
      OR: [{ clientA: { orgId } }, { clientB: { orgId } }],
    },
    select: {
      createdAt: true,
      matchSuggestion: { select: { createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  let avgHoursToMutual: number | null = null;
  if (recentMutuals.length > 0) {
    const hours = recentMutuals.map((m) => {
      const introAt = m.matchSuggestion.createdAt.getTime();
      return (m.createdAt.getTime() - introAt) / (60 * 60 * 1000);
    });
    avgHoursToMutual = Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10;
  }

  const eventCounts = await prisma.analyticsEvent.groupBy({
    by: ["eventName"],
    where: { orgId, createdAt: { gte: since } },
    _count: { id: true },
  });

  return {
    periodDays: days,
    clientsByStage: clientsByStage.map((row) => ({
      stage: row.stage,
      count: row._count.id,
    })),
    introsSent,
    introsAccepted,
    mutualCount,
    acceptanceRate,
    mutualRate,
    avgHoursToMutual,
    recentEvents: eventCounts.map((row) => ({
      eventName: row.eventName,
      count: row._count.id,
    })),
  };
}
