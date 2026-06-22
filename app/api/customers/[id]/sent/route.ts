import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.matchmakerId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }
  const { id } = await ctx.params;

  const customer = await prisma.customer.findFirst({
    where: { id, matchmakerId: session.matchmakerId },
    select: { id: true },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }

  const sent = await prisma.emailLog.findMany({
    where: {
      matchSuggestion: { customerId: id },
    },
    orderBy: { sentAt: "desc" },
    include: {
      matchSuggestion: {
        include: { poolProfile: { select: { firstName: true, lastName: true } } },
      },
    },
  });

  return NextResponse.json({
    items: sent.map((e) => ({
      id: e.id,
      subject: e.subject,
      body: e.body,
      sentAt: e.sentAt.toISOString(),
      candidateName: `${e.matchSuggestion.poolProfile.firstName} ${e.matchSuggestion.poolProfile.lastName}`,
    })),
  });
}
