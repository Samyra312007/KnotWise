import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiClientSession } from "@/lib/auth/api";
import type { Biodata } from "@/lib/types";
import { buildIntroReveal, revealLevelForSuggestion } from "@/lib/matching/reveal";

const LIST_STATUSES = ["sent", "viewed", "accepted", "declined", "mutual"] as const;

export async function GET() {
  const session = await requireApiClientSession();
  if (session instanceof NextResponse) return session;

  const suggestions = await prisma.matchSuggestion.findMany({
    where: { customerId: session.customerId, status: { in: [...LIST_STATUSES] } },
    include: { poolProfile: true, mutualMatch: { include: { conversation: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: suggestions.map((s) => {
      const biodata = JSON.parse(s.poolProfile.biodata) as Biodata;
      const revealLevel = revealLevelForSuggestion(s.status, !!s.mutualMatch);
      const candidate = buildIntroReveal({
        biodata,
        photoUrl: s.poolProfile.photoUrl,
        score: s.score,
        bucket: s.bucket,
        revealLevel,
      });

      return {
        id: s.id,
        status: s.status,
        revealLevel,
        score: s.score,
        bucket: s.bucket,
        feedbackReason: s.feedbackReason,
        feedbackAt: s.feedbackAt?.toISOString(),
        viewedAt: s.viewedAt?.toISOString(),
        mutualMatchId: s.mutualMatch?.id,
        conversationId: s.mutualMatch?.conversation?.id,
        candidate,
      };
    }),
  });
}
