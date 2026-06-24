import type { Biodata } from "@/lib/types";
import type { StrategyResult, SubScores, Weights } from "../types";
import * as s from "../scoring";
import { scoreLocationV2 } from "./location";
import { scoreKundliCompatibility } from "@/lib/astro/kundli";

export function buildV2Breakdown(input: {
  client: Biodata;
  candidate: Biodata;
  kundliEnabled: boolean;
  kundliScore?: number;
  gender: "male" | "female";
}) {
  const { client, candidate, kundliEnabled, kundliScore, gender } = input;
  const breakdown = {
    wantKids: s.scoreWantKids(client, candidate),
    religion: s.scoreReligion(client, candidate),
    motherTongue: s.scoreMotherTongue(client, candidate),
    ageDelta: gender === "male" ? s.scoreAgeMale(client, candidate) : s.scoreAgeFemale(client, candidate),
    heightDelta: gender === "male" ? s.scoreHeightMale(client, candidate) : s.scoreHeightFemale(client, candidate),
    incomeBracket: gender === "male" ? s.scoreIncomeMale(client, candidate) : s.scoreIncomeFemale(client, candidate),
    diet: s.scoreDiet(client, candidate),
    caste: s.scoreCaste(client, candidate),
    relocate: scoreLocationV2(client, candidate),
    education:
      gender === "male"
        ? s.scoreEducation(client, candidate)
        : s.scoreEducationFemalePreference(client, candidate),
    pets: s.scorePets(client, candidate),
    manglik: s.scoreManglik(client, candidate),
  };

  if (kundliEnabled) {
    (breakdown as SubScores).kundli = kundliScore ?? 0.5;
  }

  return breakdown as SubScores;
}

export function scoreWithWeightsV2(
  breakdown: SubScores,
  weights: Weights
): StrategyResult {
  const contributions = {} as Record<string, number>;
  let total = 0;
  for (const [key, weight] of Object.entries(weights)) {
    if (!weight) continue;
    const sub = breakdown[key] ?? 0;
    const contribution = weight * sub;
    contributions[key] = contribution;
    total += contribution;
  }
  return { total: Math.round(total), breakdown, contributions };
}

export function scorePairV2(input: {
  client: Biodata;
  candidate: Biodata;
  weights: Weights;
  kundliEnabled: boolean;
  clientKundliJson?: string | null;
  candidateKundliJson?: string | null;
}): StrategyResult {
  const kundliScore =
    input.kundliEnabled && input.clientKundliJson && input.candidateKundliJson
      ? scoreKundliCompatibility(input.clientKundliJson, input.candidateKundliJson)
      : 0.5;

  const breakdown = buildV2Breakdown({
    client: input.client,
    candidate: input.candidate,
    kundliEnabled: input.kundliEnabled,
    kundliScore,
    gender: input.client.gender,
  });

  return scoreWithWeightsV2(breakdown, input.weights);
}
