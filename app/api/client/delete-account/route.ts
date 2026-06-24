import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession, notFound } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import {
  cancelAccountDeletion,
  getDeletionStatus,
  scheduleAccountDeletion,
} from "@/lib/compliance/deletion";
import { DELETION_GRACE_DAYS } from "@/lib/compliance/config";

const postSchema = z.object({
  reason: z.string().max(500).optional(),
  confirm: z.literal(true),
});

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const row = await getDeletionStatus(session.customerId);
  if (!row) {
    return NextResponse.json({ scheduled: false, graceDays: DELETION_GRACE_DAYS });
  }

  return NextResponse.json({
    scheduled: row.status === "scheduled",
    status: row.status,
    scheduledFor: row.scheduledFor.toISOString(),
    requestedAt: row.requestedAt.toISOString(),
    graceDays: DELETION_GRACE_DAYS,
  });
}

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Confirm account deletion to continue." } },
      { status: 400 }
    );
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) return notFound();

  try {
    const row = await scheduleAccountDeletion({
      customerId: session.customerId,
      clientId: session.clientId,
      orgId: customer.orgId,
      reason: parsed.reason,
    });
    return NextResponse.json({
      ok: true,
      scheduledFor: row.scheduledFor.toISOString(),
      graceDays: DELETION_GRACE_DAYS,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_DELETED") {
      return NextResponse.json({ error: { code: "INVALID_STATE", message: "Account already deleted." } }, { status: 400 });
    }
    throw err;
  }
}

export async function DELETE() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) return notFound();

  const row = await cancelAccountDeletion(session.customerId, session.clientId, customer.orgId);
  if (!row) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "No pending deletion." } }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
