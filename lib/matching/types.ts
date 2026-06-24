import type { Biodata } from "@/lib/types";

export type Dimension =
  | "religion"
  | "motherTongue"
  | "caste"
  | "diet"
  | "wantKids"
  | "relocate"
  | "pets"
  | "education"
  | "incomeBracket"
  | "ageDelta"
  | "heightDelta"
  | "manglik";

export type SubScores = Record<Dimension, number> & Record<string, number>;

export type Weights = Record<Dimension, number> & { kundli?: number };

export interface StrategyResult {
  total: number;
  breakdown: SubScores;
  contributions: Record<Dimension, number>;
}

export interface Strategy {
  score(client: Biodata, candidate: Biodata): StrategyResult;
  weights: Weights;
}

export type Bucket = "high" | "medium" | "low";

export function bucketFor(score: number): Bucket {
  if (score >= 75) return "high";
  if (score >= 55) return "medium";
  return "low";
}
