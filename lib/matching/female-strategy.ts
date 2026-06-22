import type { Biodata } from "@/lib/types";
import type { Strategy, StrategyResult, Weights } from "./types";
import * as s from "./scoring";

export const femaleWeights: Weights = {
  wantKids: 16,
  religion: 14,
  motherTongue: 12,
  education: 12,
  incomeBracket: 10,
  ageDelta: 9,
  relocate: 8,
  diet: 6,
  caste: 5,
  heightDelta: 4,
  pets: 2,
  manglik: 2,
};

export const femaleStrategy: Strategy = {
  weights: femaleWeights,
  score(client: Biodata, candidate: Biodata): StrategyResult {
    const breakdown = {
      wantKids: s.scoreWantKids(client, candidate),
      religion: s.scoreReligion(client, candidate),
      motherTongue: s.scoreMotherTongue(client, candidate),
      education: s.scoreEducationFemalePreference(client, candidate),
      incomeBracket: s.scoreIncomeFemale(client, candidate),
      ageDelta: s.scoreAgeFemale(client, candidate),
      relocate: s.scoreRelocate(client, candidate),
      diet: s.scoreDiet(client, candidate),
      caste: s.scoreCaste(client, candidate),
      heightDelta: s.scoreHeightFemale(client, candidate),
      pets: s.scorePets(client, candidate),
      manglik: s.scoreManglik(client, candidate),
    };

    const contributions = {} as Record<keyof typeof breakdown, number>;
    let total = 0;
    (Object.keys(breakdown) as Array<keyof typeof breakdown>).forEach((k) => {
      const weight = femaleWeights[k];
      const sub = breakdown[k];
      const contribution = weight * sub;
      contributions[k] = contribution;
      total += contribution;
    });

    return { total: Math.round(total), breakdown, contributions };
  },
};
