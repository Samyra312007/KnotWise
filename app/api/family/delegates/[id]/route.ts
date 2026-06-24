import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import { revokeFamilyDelegate } from "@/lib/family/delegates";

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const { id } = await ctx.params;
  const customer = await prisma.customer.findUnique({
    where: { id: session.customerId },
    select: { orgId: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  try {
    await revokeFamilyDelegate({
      delegateId: id,
      customerId: session.customerId,
      orgId: customer.orgId,
      clientId: session.clientId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Delegate not found." } }, { status: 404 });
    }
    throw err;
  }
}
