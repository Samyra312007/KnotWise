import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiSession, notFound, forbidden } from "@/lib/auth/api";
import { canWriteCustomer } from "@/lib/access/customers";
import { rankMatchesForOrg, getVerifiedPool } from "@/lib/matching/org-rank";
import { explainMatchFallback } from "@/lib/ai/fallback";
import { explainMatchesBatch } from "@/lib/ai/explain";
import type { Biodata } from "@/lib/types";
import { canWriteCustomers } from "@/lib/auth/roles";

const schema = z.object({
  bucket: z.enum(["high", "medium", "all"]).default("high"),
  limit: z.number().int().min(1).max(24).default(5),
  candidateIds: z.array(z.string()).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireApiSession();
  if (session instanceof NextResponse) return session;
  if (!canWriteCustomers(session.role)) return forbidden();
  const { id } = await ctx.params;

  let parsed;
  try {
    parsed = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "Invalid body." } }, { status: 400 });
  }

  const canWrite = await canWriteCustomer(id, session.matchmakerId, session.orgId, session.role);
  if (!canWrite) return notFound("Not found.");

  const customer = await prisma.customer.findFirst({ where: { id, orgId: session.orgId } });
  if (!customer) return notFound("Not found.");

  const clientBiodata = JSON.parse(customer.biodata) as Biodata;
  const pool = await getVerifiedPool(session.orgId, clientBiodata.gender);
  let ranked = await rankMatchesForOrg(session.orgId, clientBiodata, pool, id);

  if (parsed.bucket === "high") ranked = ranked.filter((r) => r.bucket === "high");
  else if (parsed.bucket === "medium") ranked = ranked.filter((r) => r.bucket === "medium");

  if (parsed.candidateIds?.length) {
    ranked = ranked.filter((r) => parsed.candidateIds!.includes(r.id));
  }

  const top = ranked.slice(0, parsed.limit);

  const explanations = await explainMatchesBatch(
    top.map((m) => ({
      client: clientBiodata,
      candidate: m.biodata,
      breakdown: m.breakdown,
      contributions: m.contributions,
    }))
  );

  const results = [];
  for (let i = 0; i < top.length; i++) {
    const m = top[i];
    const explanation =
      explanations[i] ??
      explainMatchFallback(clientBiodata, m.biodata, m.breakdown, m.contributions);
    const row = await prisma.matchSuggestion.upsert({
      where: {
        customerId_poolProfileId: { customerId: id, poolProfileId: m.id },
      },
      update: {
        score: m.score,
        bucket: m.bucket,
        explanation,
        breakdown: JSON.stringify(m.breakdown),
        status: "shortlisted",
        shortlistedAt: new Date(),
        shortlistedBy: session.matchmakerId,
        modelAdjusted: m.modelAdjusted ?? false,
      },
      create: {
        customerId: id,
        poolProfileId: m.id,
        score: m.score,
        bucket: m.bucket,
        explanation,
        breakdown: JSON.stringify(m.breakdown),
        status: "shortlisted",
        shortlistedAt: new Date(),
        shortlistedBy: session.matchmakerId,
        modelAdjusted: m.modelAdjusted ?? false,
      },
    });
    results.push({ id: row.id, candidateId: m.id, score: m.score });
  }

  return NextResponse.json({ ok: true, shortlisted: results.length, items: results });
}
