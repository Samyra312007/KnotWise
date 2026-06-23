import type { Biodata, ScoredCandidate } from "@/lib/types";
import { passesHardFilters, type HardFilterOptions } from "./hard-filters";
import { maleStrategy, maleWeights } from "./male-strategy";
import { femaleStrategy, femaleWeights } from "./female-strategy";
import { bucketFor, type SubScores, type Weights } from "./types";

export { bucketFor };

export interface PoolEntry {
  id: string;
  biodata: Biodata;
}

export interface RankedMatch {
  id: string;
  biodata: Biodata;
  score: number;
  bucket: ReturnType<typeof bucketFor>;
  breakdown: Record<string, number>;
  contributions: Record<string, number>;
  modelAdjusted?: boolean;
}

function scoreWithWeights(
  breakdown: SubScores,
  weights: Weights
): { total: number; breakdown: SubScores; contributions: Record<string, number> } {
  const contributions = {} as Record<string, number>;
  let total = 0;
  (Object.keys(breakdown) as Array<keyof SubScores>).forEach((k) => {
    const weight = weights[k] ?? 0;
    const sub = breakdown[k];
    const contribution = weight * sub;
    contributions[k] = contribution;
    total += contribution;
  });
  return { total: Math.round(total), breakdown, contributions };
}

export function rankMatches(
  client: Biodata,
  pool: PoolEntry[],
  customWeights?: Partial<Weights>,
  filterOptions?: HardFilterOptions
): RankedMatch[] {
  const baseStrategy = client.gender === "male" ? maleStrategy : femaleStrategy;
  const weights = customWeights
    ? { ...baseStrategy.weights, ...customWeights }
    : baseStrategy.weights;
  return pool
    .filter((entry) => passesHardFilters(client, entry.biodata, filterOptions).pass)
    .map((entry) => {
      const raw = baseStrategy.score(client, entry.biodata);
      const result =
        customWeights && Object.keys(customWeights).length > 0
          ? scoreWithWeights(raw.breakdown, weights as Weights)
          : raw;
      return {
        id: entry.id,
        biodata: entry.biodata,
        score: result.total,
        bucket: bucketFor(result.total),
        breakdown: result.breakdown,
        contributions: result.contributions,
      };
    })
    .sort((a, b) => b.score - a.score);
}

export { maleWeights, femaleWeights };

export function toScoredCandidate(
  m: RankedMatch,
  explanation: string,
  alreadySent: boolean,
  sentAt?: string
): ScoredCandidate {
  return {
    candidate: { id: m.id, ...m.biodata },
    score: m.score,
    bucket: m.bucket,
    explanation,
    breakdown: m.breakdown,
    alreadySent,
    sentAt,
  };
}
