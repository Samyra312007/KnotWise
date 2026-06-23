import { prisma } from "@/lib/db";
import type { Biodata } from "@/lib/types";
import type { RankedMatch } from "./index";

const MIN_LABELS = 50;

export async function applyMlRerank(
  orgId: string,
  ranked: RankedMatch[],
  client: Biodata
): Promise<RankedMatch[]> {
  const labeled = await prisma.matchSuggestion.count({
    where: {
      customer: { orgId },
      status: { in: ["accepted", "declined"] },
    },
  });
  if (labeled < MIN_LABELS) return ranked;

  const model = await prisma.modelVersion.findFirst({
    where: { orgId },
    orderBy: { version: "desc" },
  });
  if (!model) return ranked;

  const metrics = JSON.parse(model.metrics) as { acceptanceRate?: number };
  if (!metrics.acceptanceRate) return ranked;

  const adjusted = ranked.map((m) => {
    const religionMatch = m.breakdown.religion ?? 0;
    const wantKidsMatch = m.breakdown.wantKids ?? 0;
    const heuristicProb = (religionMatch + wantKidsMatch) / 2;
    const finalScore = Math.round(0.7 * m.score + 0.3 * heuristicProb * 100);
    return {
      ...m,
      score: finalScore,
      bucket: finalScore >= 75 ? ("high" as const) : finalScore >= 55 ? ("medium" as const) : ("low" as const),
      modelAdjusted: true,
    };
  });
  return adjusted.sort((a, b) => b.score - a.score);
}

export async function computeBiasAudit(orgId: string) {
  const suggestions = await prisma.matchSuggestion.findMany({
    where: { customer: { orgId }, status: { in: ["accepted", "declined"] } },
    include: { poolProfile: true },
  });
  const byReligion: Record<string, { accepted: number; total: number }> = {};
  for (const s of suggestions) {
    const bio = JSON.parse(s.poolProfile.biodata) as Biodata;
    const key = bio.religion;
    if (!byReligion[key]) byReligion[key] = { accepted: 0, total: 0 };
    byReligion[key].total += 1;
    if (s.status === "accepted") byReligion[key].accepted += 1;
  }
  return Object.entries(byReligion).map(([religion, stats]) => ({
    religion,
    acceptanceRate: stats.total ? stats.accepted / stats.total : 0,
    total: stats.total,
  }));
}
