import type { Biodata, ScoredCandidate } from "@/lib/types";
import { passesHardFilters } from "./hard-filters";
import { maleStrategy } from "./male-strategy";
import { femaleStrategy } from "./female-strategy";
import { bucketFor, type StrategyResult } from "./types";

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
}

export function rankMatches(client: Biodata, pool: PoolEntry[]): RankedMatch[] {
  const ranker = client.gender === "male" ? maleStrategy : femaleStrategy;
  return pool
    .filter((entry) => passesHardFilters(client, entry.biodata).pass)
    .map((entry) => {
      const result: StrategyResult = ranker.score(client, entry.biodata);
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
