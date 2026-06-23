import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound } from "@/lib/auth/api";
import { canAccessCustomer } from "@/lib/access/customers";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  const allowed = await canAccessCustomer(id, session.matchmakerId, session.orgId, session.role);
  if (!allowed) return notFound("Not found.");

  const sent = await prisma.emailLog.findMany({
    where: {
      matchSuggestion: { customerId: id },
    },
    orderBy: { sentAt: "desc" },
    include: {
      matchSuggestion: {
        include: {
          poolProfile: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  return NextResponse.json({
    items: sent.map((e) => ({
      id: e.id,
      subject: e.subject,
      body: e.body,
      sentAt: e.sentAt.toISOString(),
      deliveryStatus: e.deliveryStatus,
      candidateName: `${e.matchSuggestion.poolProfile.firstName} ${e.matchSuggestion.poolProfile.lastName}`,
      suggestionId: e.matchSuggestionId,
      status: e.matchSuggestion.status,
      feedbackReason: e.matchSuggestion.feedbackReason,
    })),
  });
}
