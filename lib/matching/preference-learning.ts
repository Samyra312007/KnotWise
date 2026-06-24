import { prisma } from "@/lib/db";
import type { Weights } from "./types";

export async function recordPreferenceSignal(input: {
  customerId: string;
  poolProfileId?: string;
  suggestionId?: string;
  signalType: "view" | "open" | "dwell";
  dwellMs?: number;
  metadata?: Record<string, unknown>;
}) {
  return prisma.preferenceSignal.create({
    data: {
      customerId: input.customerId,
      poolProfileId: input.poolProfileId,
      suggestionId: input.suggestionId,
      signalType: input.signalType,
      dwellMs: input.dwellMs,
      metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
    },
  });
}

export async function getPreferenceWeightAdjustments(customerId: string): Promise<Partial<Weights>> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const signals = await prisma.preferenceSignal.findMany({
    where: { customerId, createdAt: { gte: since }, poolProfileId: { not: null } },
    take: 200,
    orderBy: { createdAt: "desc" },
  });

  if (signals.length < 5) return {};

  const poolIds = [...new Set(signals.map((s) => s.poolProfileId).filter(Boolean))] as string[];
  const profiles = await prisma.poolProfile.findMany({
    where: { id: { in: poolIds } },
    select: { id: true, biodata: true, city: true },
  });

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const religionCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};

  for (const signal of signals) {
    if (!signal.poolProfileId) continue;
    const profile = profileMap.get(signal.poolProfileId);
    if (!profile) continue;
    const bio = JSON.parse(profile.biodata) as { religion?: string; city?: string };
    const weight = signal.signalType === "dwell" && (signal.dwellMs ?? 0) > 30000 ? 2 : 1;
    if (bio.religion) religionCounts[bio.religion] = (religionCounts[bio.religion] ?? 0) + weight;
    cityCounts[profile.city] = (cityCounts[profile.city] ?? 0) + weight;
  }

  const topReligion = Object.entries(religionCounts).sort((a, b) => b[1] - a[1])[0];
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];

  const adjustments: Partial<Weights> = {};
  if (topReligion && topReligion[1] >= 3) adjustments.religion = 2;
  if (topCity && topCity[1] >= 3) adjustments.relocate = 2;

  return adjustments;
}

export function applyPreferenceAdjustments(base: Weights, adjustments: Partial<Weights>): Weights {
  const merged = { ...base };
  for (const [key, delta] of Object.entries(adjustments)) {
    const k = key as keyof Weights;
    merged[k] = Math.min(20, (merged[k] ?? 0) + (delta ?? 0));
  }
  return merged;
}
