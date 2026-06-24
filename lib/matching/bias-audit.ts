import { prisma } from "@/lib/db";
import type { Biodata } from "@/lib/types";
import { cityTier } from "./v2/location";

export type BiasSegment = {
  segment: string;
  dimension: "religion" | "caste" | "cityTier";
  acceptanceRate: number;
  total: number;
  alert: boolean;
};

export async function runBiasAudit(orgId: string): Promise<{
  segments: BiasSegment[];
  baselineRate: number;
  alerts: BiasSegment[];
}> {
  const suggestions = await prisma.matchSuggestion.findMany({
    where: { customer: { orgId }, status: { in: ["accepted", "declined"] } },
    include: { poolProfile: true },
  });

  const buckets: Record<string, { accepted: number; total: number; dimension: BiasSegment["dimension"] }> = {};

  function bump(key: string, dimension: BiasSegment["dimension"], accepted: boolean) {
    if (!buckets[key]) buckets[key] = { accepted: 0, total: 0, dimension };
    buckets[key].total += 1;
    if (accepted) buckets[key].accepted += 1;
  }

  let totalAccepted = 0;
  for (const row of suggestions) {
    const bio = JSON.parse(row.poolProfile.biodata) as Biodata;
    const accepted = row.status === "accepted";
    if (accepted) totalAccepted += 1;
    bump(`religion:${bio.religion}`, "religion", accepted);
    bump(`caste:${bio.caste}`, "caste", accepted);
    bump(`cityTier:${cityTier(bio.city)}`, "cityTier", accepted);
  }

  const baselineRate = suggestions.length ? totalAccepted / suggestions.length : 0;
  const threshold = baselineRate * 0.5;

  const segments: BiasSegment[] = Object.entries(buckets).map(([key, stats]) => {
    const [, segment] = key.split(":");
    const acceptanceRate = stats.total ? stats.accepted / stats.total : 0;
    return {
      segment,
      dimension: stats.dimension,
      acceptanceRate,
      total: stats.total,
      alert: stats.total >= 5 && baselineRate > 0 && acceptanceRate < threshold,
    };
  });

  const alerts = segments.filter((s) => s.alert);
  return { segments, baselineRate, alerts };
}

export async function computeBiasAudit(orgId: string) {
  const report = await runBiasAudit(orgId);
  return report.segments
    .filter((s) => s.dimension === "religion")
    .map((s) => ({
      religion: s.segment,
      acceptanceRate: s.acceptanceRate,
      total: s.total,
      alert: s.alert,
    }));
}
