import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiClientSession } from "@/lib/auth/api";
import { prisma } from "@/lib/db";
import { blockCustomer } from "@/lib/c2c/blocks";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({
  blockedCustomerId: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid block request." } }, { status: 400 });
  }

  if (parsed.blockedCustomerId === session.customerId) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid block request." } }, { status: 400 });
  }

  const blocked = await prisma.customer.findUnique({
    where: { id: parsed.blockedCustomerId },
    select: { orgId: true },
  });
  if (!blocked) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found." } }, { status: 404 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer || customer.orgId !== blocked.orgId) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "User not found." } }, { status: 404 });
  }

  try {
    await blockCustomer(session.customerId, parsed.blockedCustomerId);
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid block request." } }, { status: 400 });
  }

  await logAuditEvent({
    orgId: customer.orgId,
    actorId: session.clientId,
    actorType: "client",
    action: "c2c.blocked",
    entityType: "customer",
    entityId: parsed.blockedCustomerId,
  });

  return NextResponse.json({ ok: true });
}
