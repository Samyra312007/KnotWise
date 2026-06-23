import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound, forbidden } from "@/lib/auth/api";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({ action: z.enum(["accept", "decline"]) });

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid action." } }, { status: 400 });
  }

  const handoff = await prisma.handoff.findFirst({
    where: { id, toMatchmakerId: session.matchmakerId, status: "pending" },
  });
  if (!handoff) return notFound("Handoff not found.");

  if (parsed.action === "decline") {
    await prisma.handoff.update({
      where: { id },
      data: { status: "declined", resolvedAt: new Date() },
    });
    return NextResponse.json({ ok: true, status: "declined" });
  }

  const previousPrimary = await prisma.customerAssignment.findFirst({
    where: { customerId: handoff.customerId, role: "primary" },
  });

  if (previousPrimary) {
    await prisma.customerAssignment.update({
      where: { id: previousPrimary.id },
      data: { role: "collaborator" },
    });
    await prisma.customerCollaborator.upsert({
      where: {
        customerId_matchmakerId: {
          customerId: handoff.customerId,
          matchmakerId: previousPrimary.matchmakerId,
        },
      },
      create: {
        customerId: handoff.customerId,
        matchmakerId: previousPrimary.matchmakerId,
        access: "write",
      },
      update: { access: "write" },
    });
  }

  await prisma.customerAssignment.upsert({
    where: {
      customerId_matchmakerId: {
        customerId: handoff.customerId,
        matchmakerId: session.matchmakerId,
      },
    },
    create: {
      customerId: handoff.customerId,
      matchmakerId: session.matchmakerId,
      role: "primary",
    },
    update: { role: "primary" },
  });

  await prisma.handoff.update({
    where: { id },
    data: { status: "accepted", resolvedAt: new Date() },
  });

  await logAuditEvent({
    orgId: session.orgId,
    actorId: session.matchmakerId,
    actorType: "matchmaker",
    action: "handoff.accepted",
    entityType: "customer",
    entityId: handoff.customerId,
    metadata: { handoffId: id },
  });

  return NextResponse.json({ ok: true, status: "accepted" });
}
