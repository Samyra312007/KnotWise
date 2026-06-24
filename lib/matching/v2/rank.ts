import type { Biodata } from "@/lib/types";
import { rankMatches, type PoolEntry, type RankedMatch } from "../index";
import { passesHardFilters, type HardFilterOptions } from "../hard-filters";
import { activeV2Weights } from "./weights";
import { scorePairV2 } from "./strategy";
import { bucketFor, type Weights } from "../types";
import { applyPreferenceAdjustments } from "../preference-learning";

export function rankMatchesV2(
  client: Biodata,
  pool: PoolEntry[],
  options: {
    customWeights?: Partial<Weights>;
    filterOptions?: HardFilterOptions;
    kundliEnabled: boolean;
    kundliScores?: Map<string, number>;
    clientKundliJson?: string | null;
    poolKundliJson?: Map<string, string | null>;
    preferenceAdjustments?: Partial<Weights>;
  }
): RankedMatch[] {
  let weights = activeV2Weights(client.gender, options.kundliEnabled);
  if (options.preferenceAdjustments) {
    weights = applyPreferenceAdjustments(weights, options.preferenceAdjustments);
  }
  if (options.customWeights) {
    weights = { ...weights, ...options.customWeights } as Weights;
  }

  return pool
    .filter((entry) => passesHardFilters(client, entry.biodata, options.filterOptions).pass)
    .map((entry) => {
      const result = scorePairV2({
        client,
        candidate: entry.biodata,
        weights,
        kundliEnabled: options.kundliEnabled,
        clientKundliJson: options.clientKundliJson,
        candidateKundliJson: options.poolKundliJson?.get(entry.id) ?? null,
      });
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

export { rankMatches as rankMatchesV1 };
