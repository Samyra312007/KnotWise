import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

export async function createReport(input: {
  reporterId: string;
  orgId: string;
  clientId: string;
  targetType: string;
  targetId: string;
  reason: string;
}) {
  const reason = input.reason.trim().slice(0, 2000);
  if (!reason) throw new Error("EMPTY");

  const row = await prisma.report.create({
    data: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason,
    },
  });

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: "trust.report_created",
    entityType: "report",
    entityId: row.id,
    metadata: { targetType: input.targetType, targetId: input.targetId },
  });

  return row;
}

export async function listOpenReports(orgId: string) {
  return prisma.report.findMany({
    where: {
      status: "open",
      reporter: { orgId },
    },
    include: {
      reporter: { select: { id: true, firstName: true, lastName: true, city: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}

export async function resolveReport(input: {
  reportId: string;
  orgId: string;
  reviewerId: string;
  status: "resolved" | "dismissed";
}) {
  const row = await prisma.report.findFirst({
    where: { id: input.reportId, status: "open", reporter: { orgId: input.orgId } },
  });
  if (!row) throw new Error("NOT_FOUND");

  await prisma.report.update({
    where: { id: row.id },
    data: {
      status: input.status,
      reviewerId: input.reviewerId,
      resolvedAt: new Date(),
    },
  });

  return row;
}
