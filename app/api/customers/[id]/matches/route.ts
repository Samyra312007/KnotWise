import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound } from "@/lib/auth/api";
import { canAccessCustomer } from "@/lib/access/customers";
import type { Biodata, ScoredCandidate, Stage } from "@/lib/types";
import { explainMatchFallback } from "@/lib/ai/fallback";
import { explainMatchesBatch } from "@/lib/ai/explain";
import { rankMatchesForOrg, getVerifiedPool } from "@/lib/matching/org-rank";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const bucketParam = (url.searchParams.get("bucket") ?? "high").toLowerCase();
  const view = url.searchParams.get("view");
  const limit = Math.min(24, Number(url.searchParams.get("limit") ?? 12) || 12);

  const allowed = await canAccessCustomer(id, session.matchmakerId, session.orgId, session.role);
  if (!allowed) return notFound("This file is not in your bureau.");

  const customer = await prisma.customer.findFirst({ where: { id, orgId: session.orgId } });
  if (!customer) return notFound("This file is not in your bureau.");

  const clientBiodata = JSON.parse(customer.biodata) as Biodata;

  if (view === "shortlisted") {
    const rows = await prisma.matchSuggestion.findMany({
      where: { customerId: id, status: "shortlisted" },
      include: { poolProfile: true, emails: { orderBy: { sentAt: "desc" }, take: 1 } },
      orderBy: { score: "desc" },
      take: limit,
    });
    const items: ScoredCandidate[] = rows.map((row) => {
      const biodata = JSON.parse(row.poolProfile.biodata) as Biodata;
      return {
        candidate: { id: row.poolProfileId, ...biodata },
        score: row.score,
        bucket: row.bucket as ScoredCandidate["bucket"],
        explanation: row.explanation,
        breakdown: JSON.parse(row.breakdown) as Record<string, number>,
        alreadySent: false,
        modelAdjusted: row.modelAdjusted,
      };
    });
    return NextResponse.json({
      items,
      counts: { high: 0, medium: 0, all: items.length, shortlisted: items.length },
      customer: { firstName: clientBiodata.firstName, stage: customer.stage as Stage },
    });
  }

  const pool = await getVerifiedPool(session.orgId, clientBiodata.gender);
  const ranked = await rankMatchesForOrg(session.orgId, clientBiodata, pool, id);

  let filtered = ranked;
  if (bucketParam === "high") filtered = ranked.filter((r) => r.bucket === "high");
  else if (bucketParam === "medium") filtered = ranked.filter((r) => r.bucket === "medium");

  const top = filtered.slice(0, limit);

  const sentRows = await prisma.matchSuggestion.findMany({
    where: { customerId: id, poolProfileId: { in: top.map((t) => t.id) } },
    include: { emails: { select: { sentAt: true, id: true, subject: true, body: true, deliveryStatus: true }, orderBy: { sentAt: "desc" }, take: 1 } },
  });
  const sentMap = new Map(
    sentRows.map((r) => [
      r.poolProfileId,
      {
        status: r.status,
        sentAt: r.emails[0]?.sentAt ?? r.createdAt,
        lastEmail: r.emails[0] ?? null,
        explanation: r.explanation,
      },
    ])
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
      sent?.explanation ||
      explanations[idx] ||
      explainMatchFallback(clientBiodata, m.biodata, m.breakdown, m.contributions);
    return {
      candidate: { id: m.id, ...m.biodata },
      score: m.score,
      bucket: m.bucket,
      explanation,
      breakdown: m.breakdown,
      alreadySent: sent?.status === "sent",
      sentAt: sent?.sentAt ? new Date(sent.sentAt).toISOString() : undefined,
      lastEmail: sent?.lastEmail
        ? {
            subject: sent.lastEmail.subject,
            body: sent.lastEmail.body,
            deliveryStatus: sent.lastEmail.deliveryStatus,
          }
        : undefined,
      modelAdjusted: m.modelAdjusted,
    };
  });

  const shortlistedCount = await prisma.matchSuggestion.count({
    where: { customerId: id, status: "shortlisted" },
  });

  return NextResponse.json({
    items,
    counts: {
      high: ranked.filter((r) => r.bucket === "high").length,
      medium: ranked.filter((r) => r.bucket === "medium").length,
      all: ranked.length,
      shortlisted: shortlistedCount,
    },
    customer: {
      firstName: clientBiodata.firstName,
      stage: customer.stage as Stage,
    },
  });
}
