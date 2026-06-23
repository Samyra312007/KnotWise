import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound, forbidden } from "@/lib/auth/api";
import { canWriteCustomer } from "@/lib/access/customers";
import { handoffNotificationEmail } from "@/lib/email/templates";
import { enqueueMagicLinkEmail } from "@/lib/jobs/email-jobs";
import { createNotification } from "@/lib/notifications";
import { logAuditEvent } from "@/lib/audit";
import { canWriteCustomers } from "@/lib/auth/roles";

const schema = z.object({
  toMatchmakerId: z.string().min(1),
  note: z.string().min(1).max(1000),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  if (!canWriteCustomers(session.role)) return forbidden();
  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid handoff." } }, { status: 400 });
  }

  const canWrite = await canWriteCustomer(id, session.matchmakerId, session.orgId, session.role);
  if (!canWrite) return notFound("Not found.");

  const targetMember = await prisma.membership.findFirst({
    where: { orgId: session.orgId, matchmakerId: parsed.toMatchmakerId },
  });
  if (!targetMember) return notFound("Colleague not in your bureau.");

  const customer = await prisma.customer.findFirst({
    where: { id, orgId: session.orgId },
    select: { firstName: true, lastName: true },
  });
  if (!customer) return notFound("Not found.");

  const handoff = await prisma.handoff.create({
    data: {
      customerId: id,
      fromMatchmakerId: session.matchmakerId,
      toMatchmakerId: parsed.toMatchmakerId,
      note: parsed.note,
    },
  });

  const customerName = `${customer.firstName} ${customer.lastName}`;
  await createNotification(parsed.toMatchmakerId, "handoff", {
    handoffId: handoff.id,
    customerId: id,
    customerName,
    fromName: session.fullName,
    note: parsed.note,
  });

  const toMm = await prisma.matchmaker.findUnique({ where: { id: parsed.toMatchmakerId } });
  if (toMm) {
    const tpl = handoffNotificationEmail(session.fullName, customerName, parsed.note);
    await enqueueMagicLinkEmail({ to: `${toMm.username}@knotwise.local`, ...tpl });
  }

  await logAuditEvent({
    orgId: session.orgId,
    actorId: session.matchmakerId,
    actorType: "matchmaker",
    action: "handoff.requested",
    entityType: "customer",
    entityId: id,
    metadata: { handoffId: handoff.id, toMatchmakerId: parsed.toMatchmakerId },
  });

  return NextResponse.json({ ok: true, handoffId: handoff.id });
}
