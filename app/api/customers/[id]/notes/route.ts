import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound, forbidden } from "@/lib/auth/api";
import { canAccessCustomer, canWriteCustomer } from "@/lib/access/customers";
import { createNotification, parseMentions } from "@/lib/notifications";
import { mentionNotificationEmail } from "@/lib/email/templates";
import { enqueueMagicLinkEmail } from "@/lib/jobs/email-jobs";
import { canWriteCustomers } from "@/lib/auth/roles";

const schema = z.object({ body: z.string().min(1).max(2000) });

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  const allowed = await canAccessCustomer(id, session.matchmakerId, session.orgId, session.role);
  if (!allowed) return notFound("Not found.");

  const notes = await prisma.note.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
    include: { matchmaker: { select: { fullName: true } } },
  });

  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
      matchmakerName: n.matchmaker.fullName,
      mentions: JSON.parse(n.mentions) as string[],
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  if (!canWriteCustomers(session.role)) return forbidden();
  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Write something first." } }, { status: 400 });
  }

  const canWrite = await canWriteCustomer(id, session.matchmakerId, session.orgId, session.role);
  if (!canWrite) return notFound("Not found.");

  const customer = await prisma.customer.findFirst({
    where: { id, orgId: session.orgId },
    select: { firstName: true, lastName: true },
  });
  if (!customer) return notFound("Not found.");

  const mentionIds = await parseMentions(parsed.body, session.orgId);

  const note = await prisma.note.create({
    data: {
      customerId: id,
      matchmakerId: session.matchmakerId,
      body: parsed.body,
      mentions: JSON.stringify(mentionIds),
    },
    include: { matchmaker: { select: { fullName: true } } },
  });

  const customerName = `${customer.firstName} ${customer.lastName}`;
  for (const mmId of mentionIds) {
    if (mmId === session.matchmakerId) continue;
    await createNotification(mmId, "mention", {
      customerId: id,
      customerName,
      noteId: note.id,
      excerpt: parsed.body.slice(0, 120),
    });
    const mm = await prisma.matchmaker.findUnique({ where: { id: mmId }, select: { fullName: true, username: true } });
    if (mm) {
      const tpl = mentionNotificationEmail(session.fullName, customerName, parsed.body.slice(0, 120));
      const membership = await prisma.membership.findFirst({
        where: { matchmakerId: mmId, orgId: session.orgId },
        include: { matchmaker: true },
      });
      if (membership) {
        await enqueueMagicLinkEmail({
          to: `${mm.username}@knotwise.local`,
          ...tpl,
        });
      }
    }
  }

  return NextResponse.json({
    note: {
      id: note.id,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
      matchmakerName: note.matchmaker.fullName,
      mentions: mentionIds,
    },
  });
}
