import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import type { Biodata } from "@/lib/types";
import { buildIntroReveal, revealLevelForSuggestion } from "@/lib/matching/reveal";
import { markSuggestionViewed } from "@/lib/matching/mutual";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;

  await markSuggestionViewed(id, session.customerId);

  const suggestion = await prisma.matchSuggestion.findFirst({
    where: { id, customerId: session.customerId },
    include: { poolProfile: true, mutualMatch: true },
  });

  if (!suggestion) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Intro not found." } }, { status: 404 });
  }

  const biodata = JSON.parse(suggestion.poolProfile.biodata) as Biodata;
  const revealLevel = revealLevelForSuggestion(suggestion.status, !!suggestion.mutualMatch);
  const candidate = buildIntroReveal({
    biodata,
    photoUrl: suggestion.poolProfile.photoUrl,
    score: suggestion.score,
    bucket: suggestion.bucket,
    revealLevel,
  });

  return NextResponse.json({
    id: suggestion.id,
    status: suggestion.status,
    revealLevel,
    score: suggestion.score,
    bucket: suggestion.bucket,
    explanation: suggestion.explanation,
    breakdown: JSON.parse(suggestion.breakdown) as Record<string, number>,
    feedbackReason: suggestion.feedbackReason,
    feedbackAt: suggestion.feedbackAt?.toISOString(),
    viewedAt: suggestion.viewedAt?.toISOString(),
    mutualMatchId: suggestion.mutualMatch?.id,
    candidate,
  });
}
