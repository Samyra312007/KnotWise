import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/auth/api";

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const pending = await prisma.handoff.findMany({
    where: { toMatchmakerId: session.matchmakerId, status: "pending" },
    include: {
      customer: { select: { firstName: true, lastName: true, id: true } },
      fromMatchmaker: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: pending.map((h) => ({
      id: h.id,
      customerId: h.customerId,
      customerName: `${h.customer.firstName} ${h.customer.lastName}`,
      fromName: h.fromMatchmaker.fullName,
      note: h.note,
      createdAt: h.createdAt.toISOString(),
    })),
  });
}
