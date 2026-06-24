import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getPrimaryMatchmakerId } from "@/lib/access/customers";
import { canUseIntroRequest, recordIntroRequestUsage } from "@/lib/billing/client-entitlements";

export async function submitClientIntroRequest(input: {
  customerId: string;
  orgId: string;
  clientId: string;
  note?: string;
}) {
  const allowed = await canUseIntroRequest(input.customerId);
  if (!allowed.ok) throw new Error("LIMIT_REACHED");

  const request = await prisma.clientIntroRequest.create({
    data: {
      customerId: input.customerId,
      note: input.note,
    },
  });

  await recordIntroRequestUsage(input.customerId);

  const customer = await prisma.customer.findUnique({
    where: { id: input.customerId },
    select: { firstName: true, lastName: true },
  });
  const mmId = await getPrimaryMatchmakerId(input.customerId);
  if (mmId && customer) {
    await createNotification(mmId, "intro_request", {
      customerId: input.customerId,
      requestId: request.id,
      clientName: `${customer.firstName} ${customer.lastName}`,
      note: input.note,
    });
  }

  await logAuditEvent({
    orgId: input.orgId,
    actorId: input.clientId,
    actorType: "client",
    action: "intro.request",
    entityType: "client_intro_request",
    entityId: request.id,
    metadata: { note: input.note },
  });

  return request;
}
