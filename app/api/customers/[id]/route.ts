import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound, forbidden } from "@/lib/auth/api";
import { canAccessCustomer, canWriteCustomer } from "@/lib/access/customers";
import type { Biodata, Stage } from "@/lib/types";
import { STAGES } from "@/lib/types";
import { canWriteCustomers } from "@/lib/auth/roles";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  const allowed = await canAccessCustomer(id, session.matchmakerId, session.orgId, session.role);
  if (!allowed) return notFound("This file is not in your bureau.");

  const customer = await prisma.customer.findFirst({
    where: { id, orgId: session.orgId },
    include: {
      assignments: {
        where: { role: "primary" },
        include: { matchmaker: { select: { fullName: true, id: true } } },
        take: 1,
      },
      clientAccount: { select: { email: true, lastLoginAt: true } },
    },
  });

  if (!customer) return notFound("This file is not in your bureau.");

  const biodata = JSON.parse(customer.biodata) as Biodata;

  return NextResponse.json({
    customer: {
      id: customer.id,
      stage: customer.stage,
      verifiedAt: customer.verifiedAt?.toISOString() ?? null,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      photoUrl: customer.photoUrl,
      primaryMatchmaker: customer.assignments[0]?.matchmaker ?? null,
      clientAccount: customer.clientAccount,
      ...biodata,
    },
  });
}

const patchSchema = z.object({
  stage: z.enum(STAGES as [Stage, ...Stage[]]).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  if (!canWriteCustomers(session.role)) return forbidden();

  const { id } = await ctx.params;
  let body;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid update." } }, { status: 400 });
  }

  const canWrite = await canWriteCustomer(id, session.matchmakerId, session.orgId, session.role);
  if (!canWrite) return notFound("Not found.");

  const updated = await prisma.customer.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ ok: true, customer: { id: updated.id, stage: updated.stage } });
}
