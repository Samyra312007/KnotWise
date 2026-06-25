import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getPrimaryMatchmakerId } from "@/lib/access/customers";
import { deletionScheduledFor } from "./config";

export async function scheduleAccountDeletion(input: {
  customerId: string;
  clientId: string;
  orgId: string;
  reason?: string;
}) {
  const existing = await prisma.dataDeletionRequest.findUnique({
    where: { customerId: input.customerId },
  });
  if (existing?.status === "scheduled") {
    return existing;
  }
  if (existing?.status === "completed") {
    throw new Error("ALREADY_DELETED");
  }

  const scheduledFor = deletionScheduledFor();
  const row = await prisma.dataDeletionRequest.upsert({
    where: { customerId: input.customerId },
    create: {
      customerId: input.customerId,
      clientId: input.clientId,
      status: "scheduled",
      scheduledFor,
      reason: input.reason,
    },
    update: {
      status: "scheduled",
      scheduledFor,
      reason: input.reason,
      completedAt: null,
    },
  });

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: "account.deletion_scheduled",
    entityType: "customer",
    entityId: input.customerId,
    metadata: { scheduledFor: scheduledFor.toISOString() },
  });

  const mmId = await getPrimaryMatchmakerId(input.customerId);
  if (mmId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { firstName: true, lastName: true },
    });
    await createNotification(mmId, "deletion_scheduled", {
      customerId: input.customerId,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
      scheduledFor: scheduledFor.toISOString(),
    });
  }

  return row;
}

export async function cancelAccountDeletion(customerId: string, clientId: string, orgId: string) {
  const row = await prisma.dataDeletionRequest.findUnique({ where: { customerId } });
  if (!row || row.status !== "scheduled") return null;

  await prisma.dataDeletionRequest.update({
    where: { customerId },
    data: { status: "cancelled" },
  });

  await logAuditEvent({
    orgId,
    actorId: clientId,
    actorType: "client",
    action: "account.deletion_cancelled",
    entityType: "customer",
    entityId: customerId,
  });

  return row;
}

export async function executeCustomerDeletion(customerId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { clientAccount: true, poolMirror: true },
  });
  if (!customer) return false;

  await prisma.asset.deleteMany({
    where: { entityType: "customer", entityId: customerId },
  });

  await prisma.c2cMessage.updateMany({
    where: { senderId: customerId },
    data: { body: "[message removed]" },
  });

  await prisma.scheduledEvent.updateMany({
    where: {
      proposedById: customerId,
      status: { in: ["proposed", "accepted"] },
    },
    data: { status: "cancelled" },
  });

  const anonymizedEmail = `deleted+${customerId.slice(0, 10)}@anonymized.knotwise.app`;

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      firstName: "Deleted",
      lastName: "User",
      city: "—",
      photoUrl: null,
      stage: "Closed",
      verifiedAt: null,
      phoneVerifiedAt: null,
      photoVerifiedAt: null,
      verificationTier: "unverified",
      biodata: JSON.stringify({
        anonymized: true,
        email: anonymizedEmail,
        firstName: "Deleted",
        lastName: "User",
      }),
    },
  });

  if (customer.clientAccount) {
    await prisma.magicLinkToken.deleteMany({ where: { clientId: customer.clientAccount.id } });
    await prisma.clientAccount.update({
      where: { id: customer.clientAccount.id },
      data: {
        email: anonymizedEmail,
        phone: null,
        notifyEmail: false,
        passwordHash: null,
      },
    });
  }

  if (customer.poolMirror) {
    await prisma.poolProfile.update({
      where: { id: customer.poolMirror.id },
      data: {
        firstName: "Deleted",
        lastName: "User",
        city: "—",
        photoUrl: null,
        linkedCustomerId: null,
        biodata: JSON.stringify({ anonymized: true }),
        searchText: "deleted user",
      },
    });
  }

  await prisma.dataDeletionRequest.updateMany({
    where: { customerId, status: "scheduled" },
    data: { status: "completed", completedAt: new Date() },
  });

  await logAuditEvent({
    orgId: customer.orgId,
    actorId: "system",
    actorType: "system",
    action: "account.deletion_completed",
    entityType: "customer",
    entityId: customerId,
  });

  return true;
}

export async function processDueDeletions() {
  const due = await prisma.dataDeletionRequest.findMany({
    where: {
      status: "scheduled",
      scheduledFor: { lte: new Date() },
    },
    select: { customerId: true },
  });

  let processed = 0;
  for (const row of due) {
    const ok = await executeCustomerDeletion(row.customerId);
    if (ok) processed += 1;
  }

  return { processed };
}

export async function getDeletionStatus(customerId: string) {
  return prisma.dataDeletionRequest.findUnique({ where: { customerId } });
}
