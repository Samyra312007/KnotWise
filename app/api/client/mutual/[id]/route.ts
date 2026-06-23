import { NextResponse } from "next/server";
import { requireApiClientSession } from "@/lib/auth/api";
import { getMutualMatchForClient } from "@/lib/matching/mutual";
import { createConversationForMutual } from "@/lib/c2c/conversations";
import { buildIntroReveal } from "@/lib/matching/reveal";
import { prisma } from "@/lib/db";
import type { Biodata } from "@/lib/types";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  const result = await getMutualMatchForClient(id, session.customerId);
  if (!result) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Mutual match not found." } }, { status: 404 });
  }

  const conversation = await createConversationForMutual(result.mutual.id);
  const biodata = JSON.parse(result.counterpart.biodata) as Biodata;
  const suggestion = await prisma.matchSuggestion.findFirst({
    where: {
      customerId: session.customerId,
      status: "mutual",
      poolProfile: { linkedCustomerId: result.counterpartCustomerId },
    },
  });

  const score = suggestion?.score ?? 0;
  const bucket = suggestion?.bucket ?? "medium";

  return NextResponse.json({
    id: result.mutual.id,
    status: result.mutual.status,
    contactSharedAt: result.mutual.contactSharedAt?.toISOString(),
    createdAt: result.mutual.createdAt.toISOString(),
    counterpartCustomerId: result.counterpartCustomerId,
    conversationId: conversation.id,
    revealLevel: "full" as const,
    candidate: buildIntroReveal({
      biodata,
      photoUrl: result.counterpart.photoUrl,
      score,
      bucket,
      revealLevel: "full",
    }),
  });
}
