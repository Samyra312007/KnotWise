import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { downgradeClientPlan } from "@/lib/billing/client-entitlements";
import { prisma } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

export async function POST() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  await downgradeClientPlan(session.customerId, "client_cancelled");

  await logAuditEvent({
    orgId: customer.orgId,
    actorId: session.clientId,
    actorType: "client",
    action: "billing.cancelled",
    entityType: "client_billing",
    entityId: session.customerId,
  });

  return NextResponse.json({ ok: true, plan: "included" });
}
