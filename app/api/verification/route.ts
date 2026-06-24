import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, requireApiOps, notFound, forbidden } from "@/lib/auth/api";
import { canAccessCustomer, canWriteCustomer } from "@/lib/access/customers";

const submitSchema = z.object({
  entityType: z.enum(["pool_profile", "customer"]),
  entityId: z.string().min(1),
});

export async function GET(req: Request) {
  const session = await requireApiOps();
  if (session instanceof NextResponse) return session;

  const status = new URL(req.url).searchParams.get("status") ?? "pending";

  const items = await prisma.verificationCase.findMany({
    where: { orgId: session.orgId, status },
    orderBy: [{ priority: "desc" }, { submittedAt: "desc" }],
    take: 100,
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = submitSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid submission." } }, { status: 400 });
  }

  if (parsed.entityType === "customer") {
    const ok = await canWriteCustomer(parsed.entityId, session.matchmakerId, session.orgId, session.role);
    if (!ok) return notFound("Not found.");
  } else {
    const profile = await prisma.poolProfile.findFirst({
      where: { id: parsed.entityId, orgId: session.orgId },
    });
    if (!profile) return notFound("Not found.");
  }

  const existing = await prisma.verificationCase.findFirst({
    where: {
      orgId: session.orgId,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      status: { in: ["pending", "in_review"] },
    },
  });
  if (existing) {
    return NextResponse.json({ ok: true, caseId: existing.id });
  }

  const row = await prisma.verificationCase.create({
    data: {
      orgId: session.orgId,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      checklist: JSON.stringify({ phone: false, email: false, idDoc: false, photo: false }),
    },
  });

  return NextResponse.json({ ok: true, caseId: row.id });
}
