import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiDelegateSession } from "@/lib/auth/api";
import type { Biodata } from "@/lib/types";
import { buildDelegateIntroReveal } from "@/lib/family/reveal";

const LIST_STATUSES = ["sent", "viewed", "accepted", "declined", "mutual"] as const;

export async function GET() {
  const session = await requireApiDelegateSession();
  if (session instanceof NextResponse) return session;

  const suggestions = await prisma.matchSuggestion.findMany({
    where: { customerId: session.customerId, status: { in: [...LIST_STATUSES] } },
    include: { poolProfile: true, mutualMatch: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: suggestions.map((s) => {
      const biodata = JSON.parse(s.poolProfile.biodata) as Biodata;
      const candidate = buildDelegateIntroReveal({
        biodata,
        photoUrl: s.poolProfile.photoUrl,
        score: s.score,
        bucket: s.bucket,
        status: s.status,
        mutualMatch: s.mutualMatch,
      });

      return {
        id: s.id,
        status: s.status,
        revealLevel: candidate.revealLevel,
        score: s.score,
        bucket: s.bucket,
        feedbackReason: s.feedbackReason,
        feedbackAt: s.feedbackAt?.toISOString(),
        viewedAt: s.viewedAt?.toISOString(),
        mutualMatchId: s.mutualMatch?.id,
        candidate,
      };
    }),
  });
}
