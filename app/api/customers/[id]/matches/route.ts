import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";
import type { Biodata, ScoredCandidate, Stage } from "@/lib/types";
import { rankMatches } from "@/lib/matching";
import { explainMatchFallback } from "@/lib/ai/fallback";
import { explainMatchesBatch } from "@/lib/ai/explain";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.matchmakerId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in first." } }, { status: 401 });
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const bucketParam = (url.searchParams.get("bucket") ?? "high").toLowerCase();
  const limit = Math.min(24, Number(url.searchParams.get("limit") ?? 12) || 12);

  const customer = await prisma.customer.findFirst({
    where: { id, matchmakerId: session.matchmakerId },
  });
  if (!customer) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "This file is not in your bureau." } }, { status: 404 });
  }

  const clientBiodata = JSON.parse(customer.biodata) as Biodata;
  const oppositeGender = clientBiodata.gender === "male" ? "female" : "male";

  const pool = await prisma.poolProfile.findMany({
    where: { gender: oppositeGender },
    select: { id: true, biodata: true },
  });

  const ranked = rankMatches(
    clientBiodata,
    pool.map((p) => ({ id: p.id, biodata: JSON.parse(p.biodata) as Biodata }))
  );

  let filtered = ranked;
  if (bucketParam === "high") filtered = ranked.filter((r) => r.bucket === "high");
  else if (bucketParam === "medium") filtered = ranked.filter((r) => r.bucket === "medium");

  const top = filtered.slice(0, limit);

  const sentRows = await prisma.matchSuggestion.findMany({
    where: { customerId: id, poolProfileId: { in: top.map((t) => t.id) } },
    include: { emails: { select: { sentAt: true }, orderBy: { sentAt: "desc" }, take: 1 } },
  });
  const sentMap = new Map(
    sentRows.map((r) => [r.poolProfileId, { status: r.status, sentAt: r.emails[0]?.sentAt ?? r.createdAt }])
  );

  const explanations = await explainMatchesBatch(
    top.map((m) => ({
      client: clientBiodata,
      candidate: m.biodata,
      breakdown: m.breakdown,
      contributions: m.contributions,
    }))
  );

  const items: ScoredCandidate[] = top.map((m, idx) => {
    const sent = sentMap.get(m.id);
    const explanation =
      explanations[idx] ??
      explainMatchFallback(clientBiodata, m.biodata, m.breakdown, m.contributions);
    return {
      candidate: { id: m.id, ...m.biodata },
      score: m.score,
      bucket: m.bucket,
      explanation,
      breakdown: m.breakdown,
      alreadySent: sent?.status === "sent",
      sentAt: sent?.sentAt ? new Date(sent.sentAt).toISOString() : undefined,
    };
  });

  const total = {
    high: ranked.filter((r) => r.bucket === "high").length,
    medium: ranked.filter((r) => r.bucket === "medium").length,
    all: ranked.length,
  };

  return NextResponse.json({
    items,
    counts: total,
    customer: {
      firstName: clientBiodata.firstName,
      stage: customer.stage as Stage,
    },
  });
}
