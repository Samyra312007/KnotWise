import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession } from "@/lib/auth/api";

export async function GET() {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const items = await prisma.notification.findMany({
    where: { matchmakerId: session.matchmakerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unread = await prisma.notification.count({
    where: { matchmakerId: session.matchmakerId, readAt: null },
  });

  return NextResponse.json({
    unread,
    items: items.map((n) => ({
      id: n.id,
      type: n.type,
      payload: JSON.parse(n.payload),
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(req: Request) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;

  const { ids } = (await req.json()) as { ids?: string[] };
  if (ids?.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, matchmakerId: session.matchmakerId },
      data: { readAt: new Date() },
    });
  } else {
    await prisma.notification.updateMany({
      where: { matchmakerId: session.matchmakerId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
