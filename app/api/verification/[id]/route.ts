import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiOps, notFound } from "@/lib/auth/api";
import { z } from "zod";
import { refreshCustomerVerificationTier } from "@/lib/trust/tier-sync";

const reviewSchema = z.object({
  status: z.enum(["in_review", "verified", "rejected"]),
  checklist: z.record(z.boolean()).optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = reviewSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid review." } }, { status: 400 });
  }

  const row = await prisma.verificationCase.findFirst({
    where: { id, orgId: session.orgId },
  });
  if (!row) return notFound("Case not found.");

  const data: {
    status: string;
    reviewerId: string;
    notes?: string;
    checklist?: string;
    resolvedAt?: Date;
  } = {
    status: parsed.status,
    reviewerId: session.matchmakerId,
    notes: parsed.notes,
  };

  if (parsed.checklist) data.checklist = JSON.stringify(parsed.checklist);
  if (parsed.status === "verified" || parsed.status === "rejected") {
    data.resolvedAt = new Date();
  }

  await prisma.verificationCase.update({ where: { id }, data });

  if (parsed.status === "verified") {
    if (row.entityType === "customer") {
      const checklist = parsed.checklist ?? (JSON.parse(row.checklist) as Record<string, boolean>);
      await prisma.customer.update({
        where: { id: row.entityId },
        data: {
          verifiedAt: new Date(),
          photoVerifiedAt: checklist.photo ? new Date() : undefined,
        },
      });
      await refreshCustomerVerificationTier(row.entityId);
    } else {
      await prisma.poolProfile.update({
        where: { id: row.entityId },
        data: { verifiedAt: new Date() },
      });
    }
  }

  return NextResponse.json({ ok: true, status: parsed.status });
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  const row = await prisma.verificationCase.findFirst({
    where: { id, orgId: session.orgId },
    include: { documents: true },
  });
  if (!row) return notFound("Case not found.");

  return NextResponse.json({
    case: {
      ...row,
      checklist: JSON.parse(row.checklist),
      submittedAt: row.submittedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    },
  });
}
